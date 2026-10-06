"""
Replicate-backed anime video generation.

Modes:
  image → video  :  stability-ai/stable-video-diffusion
  text  → video  :  wan-ai/wan2.1-t2v-480p
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx
import replicate
from replicate.client import Client
from replicate.exceptions import ReplicateError

from app.config import get_settings
from app.utils.urls import is_http_url

logger = logging.getLogger(__name__)

# ── Model slugs ────────────────────────────────────────────────────────────────
MODEL_IMAGE_TO_VIDEO = "stability-ai/stable-video-diffusion"
MODEL_TEXT_TO_VIDEO = "wan-ai/wan2.1-t2v-480p"

DEFAULT_TIMEOUT = 300  # 5 min — video is slower than images

# ── Style prompts ──────────────────────────────────────────────────────────────
_STYLE_FRAGMENTS: dict[str, str] = {
    "modern-anime":   "modern anime style, vibrant colors, clean line art, fluid motion",
    "studio-ghibli":  "studio ghibli style, soft painted look, warm lighting, gentle motion",
    "manga":          "black and white manga style, ink linework, dramatic contrast",
    "cyberpunk":      "cyberpunk anime style, neon lights, futuristic city, dynamic camera",
    "chibi":          "chibi anime style, cute proportions, big expressive eyes, bouncy motion",
    "watercolor":     "watercolor anime style, soft washes, delicate painted motion",
}

_STYLE_ALIASES: dict[str, str] = {
    "modern anime":  "modern-anime",
    "studio ghibli": "studio-ghibli",
    "ghibli":        "studio-ghibli",
    "cyberpunk":     "cyberpunk",
    "watercolour":   "watercolor",
}


def _normalize_style(style: str) -> str:
    key = style.strip().lower()
    return _STYLE_ALIASES.get(key, key.replace(" ", "-"))


def _style_fragment(style: str) -> str:
    return _STYLE_FRAGMENTS.get(_normalize_style(style), _STYLE_FRAGMENTS["modern-anime"])


def _build_text_prompt(user_prompt: str, anime_style: str) -> str:
    fragment = _style_fragment(anime_style)
    return f"{user_prompt.strip()}, {fragment}, high quality anime animation"


def _get_client() -> Client:
    token = get_settings().replicate_api_token
    if not token:
        raise RuntimeError(
            "REPLICATE_API_TOKEN is not configured. Add it to backend/.env."
        )
    return Client(api_token=token)


def _extract_video_url(output: Any) -> str:
    """Normalize various Replicate output shapes into a single URL string."""
    if output is None:
        raise RuntimeError("Replicate returned empty output")

    if isinstance(output, list):
        if not output:
            raise RuntimeError("Replicate returned an empty output list")
        return _extract_video_url(output[0])

    if isinstance(output, dict):
        for key in ("url", "video", "video_url", "output"):
            if key in output:
                return _extract_video_url(output[key])
        raise RuntimeError(f"Unexpected dict output keys: {list(output)}")

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
    if as_str.startswith("http"):
        return as_str

    raise RuntimeError(f"Could not extract video URL from output type={type(output).__name__}")


def _run_prediction(client: Client, model_slug: str, model_input: dict[str, Any]) -> Any:
    """Create a prediction and poll until terminal state."""
    model = client.models.get(model_slug)
    version = model.latest_version
    if version is None:
        raise RuntimeError(f"Model '{model_slug}' has no latest version")

    logger.info("Creating prediction for %s input_keys=%s", model_slug, sorted(model_input.keys()))

    prediction = client.predictions.create(
        version=version.id,
        input=model_input,
    )

    deadline = time.monotonic() + DEFAULT_TIMEOUT
    while prediction.status not in {"succeeded", "failed", "canceled"}:
        if time.monotonic() > deadline:
            try:
                client.predictions.cancel(prediction.id)
            except Exception:
                pass
            raise TimeoutError("Video generation timed out")
        time.sleep(2)
        prediction = client.predictions.get(prediction.id)

    if prediction.status != "succeeded":
        err = getattr(prediction, "error", None) or prediction.status
        raise RuntimeError(f"Prediction did not succeed: {err}")

    return prediction.output


# ── Public entrypoints ─────────────────────────────────────────────────────────

def generate_video_from_image(
    image_url: str,
    anime_style: str = "modern-anime",
    duration: str = "short",
) -> dict[str, str]:
    """Animate an existing image using Stable Video Diffusion."""
    if not is_http_url(image_url):
        raise ValueError("image_url must be a public http(s) URL")

    client = _get_client()
    # SVD input schema
    model_input: dict[str, Any] = {
        "input_image": image_url,
        "video_length": "14_frames_with_svd" if duration == "short" else "25_frames_with_svd_xt",
        "sizing_strategy": "maintain_aspect_ratio",
        "frames_per_second": 6,
        "motion_bucket_id": 127,
        "cond_aug": 0.02,
        "decoding_t": 14,
    }

    try:
        output = _run_prediction(client, MODEL_IMAGE_TO_VIDEO, model_input)
    except (ReplicateError, httpx.HTTPError) as exc:
        raise RuntimeError(f"Replicate error: {exc}") from exc

    video_url = _extract_video_url(output)
    if not is_http_url(video_url):
        raise RuntimeError("Generated output was not a valid video URL")

    logger.info("generate_video_from_image success url=%s", video_url[:60])
    return {"status": "success", "video_url": video_url, "mode": "image", "duration": duration}


def generate_video_from_text(
    prompt: str,
    anime_style: str = "modern-anime",
    duration: str = "short",
) -> dict[str, str]:
    """Generate an anime video from a text prompt using Wan 2.1."""
    client = _get_client()
    full_prompt = _build_text_prompt(prompt, anime_style)
    num_frames = 81 if duration == "short" else 121

    model_input: dict[str, Any] = {
        "prompt": full_prompt,
        "negative_prompt": (
            "low quality, blurry, distorted, watermark, text, logo, "
            "photorealistic, extra limbs, static, frozen"
        ),
        "num_frames": num_frames,
        "sample_steps": 30,
        "guide_scale": 5.0,
        "sample_shift": 8,
        "fps": 16,
    }

    try:
        output = _run_prediction(client, MODEL_TEXT_TO_VIDEO, model_input)
    except (ReplicateError, httpx.HTTPError) as exc:
        raise RuntimeError(f"Replicate error: {exc}") from exc

    video_url = _extract_video_url(output)
    if not is_http_url(video_url):
        raise RuntimeError("Generated output was not a valid video URL")

    logger.info("generate_video_from_text success url=%s", video_url[:60])
    return {"status": "success", "video_url": video_url, "mode": "text", "duration": duration}
