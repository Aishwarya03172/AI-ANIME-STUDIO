"""
Replicate client for anime image generation.

Uses the official `replicate` Python SDK. Model input payloads are built from
each model's live OpenAPI schema so we do not hardcode parameter names.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
import replicate
from replicate.client import Client
from replicate.exceptions import ReplicateError

from app.config import get_settings
from app.utils.urls import is_http_url

logger = logging.getLogger(__name__)

Quality = Literal["fast", "premium"]

MODEL_FAST = "zf-kbot/photo-to-anime"
MODEL_PREMIUM = "datacte/flux-aesthetic-anime"

# Prefer these property names (in order) when the schema exposes an image input.
_IMAGE_FIELD_CANDIDATES = (
    "image",
    "image_url",
    "input_image",
    "init_image",
    "img",
    "photo",
)

_PROMPT_FIELD_CANDIDATES = (
    "prompt",
    "text_prompt",
    "text",
    "style_prompt",
)

_NEGATIVE_PROMPT_FIELD_CANDIDATES = (
    "negative_prompt",
    "negative",
)

# Normalized style id → prompt fragments used when the model accepts a prompt.
_STYLE_PROMPTS: dict[str, str] = {
    "modern-anime": (
        "modern anime style, clean line art, vibrant colors, sharp details, "
        "anime illustration, high quality"
    ),
    "studio-ghibli": (
        "studio ghibli style, soft painted backgrounds, warm lighting, "
        "gentle atmosphere, hand-drawn anime aesthetic"
    ),
    "manga": (
        "black and white manga style, ink linework, screentones, dramatic "
        "contrast, comic panel energy"
    ),
    "cyberpunk": (
        "cyberpunk anime style, neon lights, chrome reflections, futuristic "
        "city night, high contrast"
    ),
    "chibi": (
        "chibi anime style, cute proportions, big expressive eyes, soft shading"
    ),
    "watercolor": (
        "watercolor anime style, soft washes, delicate textures, artistic "
        "painted look"
    ),
}

_STYLE_ALIASES: dict[str, str] = {
    "modern anime": "modern-anime",
    "modern_anime": "modern-anime",
    "studio ghibli": "studio-ghibli",
    "studio_ghibli": "studio-ghibli",
    "ghibli": "studio-ghibli",
    "cyber punk": "cyberpunk",
    "water color": "watercolor",
    "water-colour": "watercolor",
    "watercolour": "watercolor",
}

_DEFAULT_NEGATIVE = (
    "low quality, blurry, distorted face, extra limbs, photorealistic, "
    "watermark, text, logo"
)

# Seconds to wait for a prediction before raising a timeout error.
DEFAULT_TIMEOUT_SECONDS = 180


class ReplicateConfigError(RuntimeError):
    """Raised when REPLICATE_API_TOKEN is missing."""


class InvalidImageUrlError(ValueError):
    """Raised when the source image URL is not a valid http(s) URL."""


class ReplicateTimeoutError(TimeoutError):
    """Raised when a Replicate prediction exceeds the wait budget."""


class ReplicateGenerationError(RuntimeError):
    """Raised when Replicate returns an error or unexpected output."""


def _normalize_style(anime_style: str) -> str:
    key = anime_style.strip().lower().replace("_", " ")
    key = " ".join(key.split())
    if key in _STYLE_ALIASES:
        return _STYLE_ALIASES[key]
    return key.replace(" ", "-")


def _style_prompt(anime_style: str) -> str:
    style_id = _normalize_style(anime_style)
    fragment = _STYLE_PROMPTS.get(style_id, _STYLE_PROMPTS["modern-anime"])
    return (
        f"transform this photo into anime art, {fragment}, "
        f"preserve likeness and composition"
    )


def _select_model(quality: str) -> str:
    q = (quality or "fast").strip().lower()
    if q == "premium":
        return MODEL_PREMIUM
    if q == "fast":
        return MODEL_FAST
    raise ValueError(f"Unsupported quality '{quality}'. Use 'fast' or 'premium'.")


def _mask_secret(value: str) -> str:
    if not value:
        return "(empty)"
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}…{value[-4:]}"


def _get_client() -> Client:
    settings = get_settings()
    token = settings.replicate_api_token
    if not token:
        logger.error("REPLICATE_API_TOKEN is missing from environment")
        raise ReplicateConfigError(
            "REPLICATE_API_TOKEN is not configured. "
            "Add it to backend/.env and restart the server."
        )
    logger.info(
        "Initializing Replicate client (token=%s)",
        _mask_secret(token),
    )
    return Client(api_token=token)


def _input_schema_for_model(client: Client, model_slug: str) -> dict[str, Any]:
    """
    Load the live OpenAPI Input schema for the model's latest version.
    """
    model = client.models.get(model_slug)
    version = model.latest_version
    if version is None:
        raise ReplicateGenerationError(f"Model '{model_slug}' has no latest version")

    schema = getattr(version, "openapi_schema", None) or {}
    components = schema.get("components") or {}
    schemas = components.get("schemas") or {}
    input_schema = schemas.get("Input") or {}

    properties: dict[str, Any] = input_schema.get("properties") or {}
    required = list(input_schema.get("required") or [])

    logger.info(
        "Loaded schema for %s version=%s properties=%s required=%s",
        model_slug,
        getattr(version, "id", "?")[:12] + "…",
        sorted(properties.keys()),
        required,
    )
    return {
        "version_id": getattr(version, "id", None),
        "properties": properties,
        "required": required,
        "model_slug": model_slug,
    }


def _first_matching_field(
    properties: dict[str, Any],
    candidates: tuple[str, ...],
) -> str | None:
    for name in candidates:
        if name in properties:
            return name
    return None


def _build_model_input(
    *,
    properties: dict[str, Any],
    required: list[str],
    image_url: str,
    anime_style: str,
) -> dict[str, Any]:
    """
    Construct the prediction input dict from schema properties only.
    """
    props = properties
    payload: dict[str, Any] = {}
    prompt_text = _style_prompt(anime_style)

    image_field = _first_matching_field(props, _IMAGE_FIELD_CANDIDATES)
    prompt_field = _first_matching_field(props, _PROMPT_FIELD_CANDIDATES)
    negative_field = _first_matching_field(props, _NEGATIVE_PROMPT_FIELD_CANDIDATES)

    if image_field:
        payload[image_field] = image_url
    elif any(name in required for name in _IMAGE_FIELD_CANDIDATES):
        raise ReplicateGenerationError(
            "Model requires an image input, but no known image field was found "
            f"in schema properties: {sorted(props.keys())}"
        )

    if prompt_field:
        # Premium / text-capable models: enrich with style guidance.
        if image_field:
            payload[prompt_field] = prompt_text
        else:
            # Text-to-image only models: still pass a strong style prompt.
            payload[prompt_field] = (
                f"{prompt_text}, highly detailed anime illustration"
            )

    if negative_field:
        payload[negative_field] = _DEFAULT_NEGATIVE

    # Optional knobs — only set when the schema actually exposes them.
    if "strength" in props:
        # Higher = stronger anime transformation for photo-to-anime models.
        payload["strength"] = props["strength"].get("default", 0.75)
        if isinstance(payload["strength"], (int, float)):
            payload["strength"] = float(payload["strength"])
        else:
            payload["strength"] = 0.75

    if "prompt_strength" in props and image_field:
        payload["prompt_strength"] = 0.7

    if "guidance_scale" in props:
        default = props["guidance_scale"].get("default", 7.5)
        payload["guidance_scale"] = float(default) if default is not None else 7.5

    if "num_outputs" in props:
        payload["num_outputs"] = 1

    if "output_format" in props:
        enums = props["output_format"].get("enum") or []
        payload["output_format"] = "png" if "png" in enums else (
            enums[0] if enums else "webp"
        )

    # Ensure required fields we know how to satisfy are present.
    missing_required = [
        name
        for name in required
        if name not in payload
        and name not in {"seed"}  # seed is optional even if listed sometimes
    ]
    # If a required field remains unknown, log — Replicate will error clearly.
    if missing_required:
        logger.warning(
            "Schema required fields not auto-filled: %s (available=%s)",
            missing_required,
            sorted(props.keys()),
        )

    if not payload:
        raise ReplicateGenerationError(
            f"Unable to build model input from schema properties: {sorted(props.keys())}"
        )

    logger.info("Built model input keys=%s", sorted(payload.keys()))
    return payload


def _extract_image_url(output: Any) -> str:
    """Normalize Replicate output into a single HTTPS image URL string."""
    if output is None:
        raise ReplicateGenerationError("Replicate returned empty output")

    if isinstance(output, list):
        if not output:
            raise ReplicateGenerationError("Replicate returned an empty output list")
        return _extract_image_url(output[0])

    if isinstance(output, dict):
        for key in ("url", "image", "image_url", "output"):
            if key in output:
                return _extract_image_url(output[key])
        raise ReplicateGenerationError(f"Unexpected dict output keys: {list(output)}")

    # FileOutput / URI-like objects from the SDK
    for attr in ("url", "uri"):
        value = getattr(output, attr, None)
        if callable(value):
            try:
                value = value()
            except TypeError:
                pass
        if isinstance(value, str) and value.startswith("http"):
            return value

    as_str = str(output)
    if as_str.startswith("http://") or as_str.startswith("https://"):
        return as_str

    raise ReplicateGenerationError(
        f"Could not extract image URL from output type={type(output).__name__}"
    )


def generate_anime(
    image_url: str,
    anime_style: str,
    quality: str = "fast",
    *,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> dict[str, str]:
    """
    Run a Replicate anime model and return the stable API payload:

        {"status": "success", "image_url": "<generated_image_url>"}
    """
    if not is_http_url(image_url):
        raise InvalidImageUrlError(
            "image_url must be a public http(s) URL that Replicate can fetch"
        )

    model_slug = _select_model(quality)
    style_id = _normalize_style(anime_style)

    logger.info(
        "generate_anime start model=%s style=%s quality=%s host=%s",
        model_slug,
        style_id,
        quality,
        urlparse(image_url).netloc,
    )

    client = _get_client()
    started = time.monotonic()

    try:
        meta = _input_schema_for_model(client, model_slug)
        model_input = _build_model_input(
            properties=meta["properties"],
            required=meta["required"],
            image_url=image_url,
            anime_style=anime_style,
        )

        # Create + poll so we can enforce a hard timeout without leaking secrets.
        if meta["version_id"]:
            prediction = client.predictions.create(
                version=meta["version_id"],
                input=model_input,
            )
        else:
            prediction = client.predictions.create(
                model=model_slug,
                input=model_input,
            )

        deadline = started + timeout_seconds
        while prediction.status not in {"succeeded", "failed", "canceled"}:
            if time.monotonic() > deadline:
                try:
                    client.predictions.cancel(prediction.id)
                except Exception:  # noqa: BLE001
                    logger.warning(
                        "Failed to cancel timed-out prediction %s",
                        prediction.id,
                    )
                raise ReplicateTimeoutError("Anime generation timed out")
            time.sleep(1.5)
            prediction = client.predictions.get(prediction.id)

        if prediction.status != "succeeded":
            err = getattr(prediction, "error", None) or prediction.status
            raise ReplicateGenerationError(f"Prediction did not succeed: {err}")

        output = prediction.output

    except InvalidImageUrlError:
        raise
    except ReplicateConfigError:
        raise
    except httpx.TimeoutException as exc:
        logger.exception("Network timeout talking to Replicate")
        raise ReplicateTimeoutError("Timed out while contacting Replicate") from exc
    except httpx.HTTPError as exc:
        logger.exception("Network error talking to Replicate")
        raise ReplicateGenerationError(
            "Network error while contacting Replicate"
        ) from exc
    except ReplicateError as exc:
        logger.exception("Replicate API error")
        raise ReplicateGenerationError(f"Replicate API error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 — normalize unknown SDK failures
        # Some SDK versions raise generic Exception on wait timeout.
        message = str(exc).lower()
        if "timeout" in message or "timed out" in message:
            logger.exception("Replicate prediction timed out")
            raise ReplicateTimeoutError("Anime generation timed out") from exc
        logger.exception("Unexpected Replicate failure")
        raise ReplicateGenerationError(f"Unexpected Replicate failure: {exc}") from exc

    elapsed = time.monotonic() - started
    if elapsed > timeout_seconds:
        raise ReplicateTimeoutError("Anime generation timed out")

    image_result = _extract_image_url(output)
    if not is_http_url(image_result):
        raise ReplicateGenerationError("Generated output was not a valid image URL")

    logger.info(
        "generate_anime success model=%s elapsed=%.1fs",
        model_slug,
        elapsed,
    )
    return {"status": "success", "image_url": image_result}


# Re-export Client for typing / tests without forcing callers to import replicate.
__all__ = [
    "generate_anime",
    "ReplicateConfigError",
    "InvalidImageUrlError",
    "ReplicateTimeoutError",
    "ReplicateGenerationError",
    "MODEL_FAST",
    "MODEL_PREMIUM",
]
