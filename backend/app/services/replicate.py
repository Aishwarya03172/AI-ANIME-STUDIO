"""
Replicate client for anime image generation.

Uses fofr/style-transfer (fast) and fofr/become-image (premium).
Both are reliably available and GPU-efficient.
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

# fofr/style-transfer: structure_image (photo) + style_image (anime ref) + prompt
MODEL_FAST = "fofr/style-transfer"
# fofr/become-image: image (photo) + image_to_become (anime ref) + prompt
MODEL_PREMIUM = "fofr/become-image"

# Public anime-style reference images used as style targets
_STYLE_REFS: dict[str, str] = {
    "modern-anime": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Neon_Genesis_Evangelion_volume_1.jpg/800px-Neon_Genesis_Evangelion_volume_1.jpg",
    "studio-ghibli": "https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Miazaki_spirited_away.jpg/220px-Miazaki_spirited_away.jpg",
    "manga": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Manga_scanlines.svg/800px-Manga_scanlines.svg.png",
    "cyberpunk": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Neon-light-163498.jpg/800px-Neon-light-163498.jpg",
    "chibi": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png",
    "watercolor": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg",
}

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
    "watercolour": "watercolor",
}

_DEFAULT_NEGATIVE = (
    "low quality, blurry, distorted face, extra limbs, photorealistic, "
    "watermark, text, logo"
)

DEFAULT_TIMEOUT_SECONDS = 180


class ReplicateConfigError(RuntimeError):
    pass


class InvalidImageUrlError(ValueError):
    pass


class ReplicateTimeoutError(TimeoutError):
    pass


class ReplicateGenerationError(RuntimeError):
    pass


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


def _style_ref_url(anime_style: str) -> str:
    style_id = _normalize_style(anime_style)
    return _STYLE_REFS.get(style_id, _STYLE_REFS["modern-anime"])


def _get_client() -> Client:
    token = get_settings().replicate_api_token
    if not token:
        raise ReplicateConfigError(
            "REPLICATE_API_TOKEN is not configured. "
            "Add it to backend/.env and restart the server."
        )
    return Client(api_token=token)


def _poll_prediction(client: Client, prediction: Any, timeout_seconds: int) -> Any:
    deadline = time.monotonic() + timeout_seconds
    while prediction.status not in {"succeeded", "failed", "canceled"}:
        if time.monotonic() > deadline:
            try:
                client.predictions.cancel(prediction.id)
            except Exception:
                pass
            raise ReplicateTimeoutError("Anime generation timed out")
        time.sleep(1.5)
        prediction = client.predictions.get(prediction.id)

    if prediction.status != "succeeded":
        err = getattr(prediction, "error", None) or prediction.status
        raise ReplicateGenerationError(f"Prediction did not succeed: {err}")

    return prediction.output


def _extract_image_url(output: Any) -> str:
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
    if not is_http_url(image_url):
        raise InvalidImageUrlError(
            "image_url must be a public http(s) URL that Replicate can fetch"
        )

    style_id = _normalize_style(anime_style)
    prompt = _style_prompt(anime_style)
    style_ref = _style_ref_url(anime_style)
    client = _get_client()
    started = time.monotonic()

    logger.info(
        "generate_anime start quality=%s style=%s host=%s",
        quality,
        style_id,
        urlparse(image_url).netloc,
    )

    try:
        if quality == "premium":
            # fofr/become-image: image + image_to_become + prompt
            model = client.models.get(MODEL_PREMIUM)
            version = model.latest_version
            model_input = {
                "image": image_url,
                "image_to_become": style_ref,
                "prompt": prompt,
                "negative_prompt": _DEFAULT_NEGATIVE,
                "number_of_images": 1,
                "denoising_strength": 1.0,
                "image_to_become_strength": 0.75,
                "disable_safety_checker": True,
            }
        else:
            # fofr/style-transfer: structure_image + style_image + prompt
            model = client.models.get(MODEL_FAST)
            version = model.latest_version
            model_input = {
                "structure_image": image_url,
                "style_image": style_ref,
                "prompt": prompt,
                "negative_prompt": _DEFAULT_NEGATIVE,
                "number_of_images": 1,
                "output_format": "png",
                "structure_depth_strength": 0.9,
                "structure_denoising_strength": 0.65,
            }

        if version is None:
            raise ReplicateGenerationError(f"Model has no latest version")

        prediction = client.predictions.create(
            version=version.id,
            input=model_input,
        )

        output = _poll_prediction(client, prediction, timeout_seconds)

    except (InvalidImageUrlError, ReplicateConfigError, ReplicateTimeoutError,
            ReplicateGenerationError):
        raise
    except httpx.TimeoutException as exc:
        raise ReplicateTimeoutError("Timed out while contacting Replicate") from exc
    except httpx.HTTPError as exc:
        raise ReplicateGenerationError(f"Network error: {exc}") from exc
    except ReplicateError as exc:
        raise ReplicateGenerationError(f"Replicate API error: {exc}") from exc
    except Exception as exc:
        msg = str(exc).lower()
        if "timeout" in msg or "timed out" in msg:
            raise ReplicateTimeoutError("Anime generation timed out") from exc
        raise ReplicateGenerationError(f"Unexpected failure: {exc}") from exc

    elapsed = time.monotonic() - started
    image_result = _extract_image_url(output)

    if not is_http_url(image_result):
        raise ReplicateGenerationError("Generated output was not a valid image URL")

    logger.info("generate_anime success elapsed=%.1fs url=%s", elapsed, image_result[:60])
    return {"status": "success", "image_url": image_result}


__all__ = [
    "generate_anime",
    "ReplicateConfigError",
    "InvalidImageUrlError",
    "ReplicateTimeoutError",
    "ReplicateGenerationError",
    "MODEL_FAST",
    "MODEL_PREMIUM",
]
