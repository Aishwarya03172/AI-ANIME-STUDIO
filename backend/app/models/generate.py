"""Request and response schemas for anime generation."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class GenerateAnimeRequest(BaseModel):
    """Body for `POST /generate-anime`."""

    image_url: HttpUrl = Field(
        ...,
        description="Public URL of the source image to stylize.",
        examples=["https://example.com/photo.jpg"],
    )
    anime_style: str = Field(
        ...,
        min_length=1,
        description="Selected anime style id or label (e.g. modern-anime).",
        examples=["modern-anime"],
    )
    quality: Literal["fast", "premium"] = Field(
        default="fast",
        description=(
            "Generation quality. "
            "'fast' → zf-kbot/photo-to-anime; "
            "'premium' → datacte/flux-aesthetic-anime."
        ),
    )


class GenerateAnimeResponse(BaseModel):
    """Successful generation payload."""

    status: Literal["success"] = "success"
    image_url: str = Field(
        ...,
        description="URL of the generated anime image.",
        examples=["https://example.com/generated-image.png"],
    )
