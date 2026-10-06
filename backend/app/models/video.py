"""Request and response schemas for anime video generation."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


class GenerateVideoRequest(BaseModel):
    """Body for `POST /generate-video`."""

    mode: Literal["image", "text"] = Field(
        ...,
        description=(
            "'image' — animate an existing image into a short video clip. "
            "'text' — generate a video from a text prompt."
        ),
    )
    # Required when mode == "image"
    image_url: Optional[HttpUrl] = Field(
        default=None,
        description="Public URL of the source anime image (required for image mode).",
        examples=["https://res.cloudinary.com/example/image/upload/photo.jpg"],
    )
    # Required when mode == "text"
    prompt: Optional[str] = Field(
        default=None,
        min_length=1,
        description="Text description of the anime video to generate (required for text mode).",
        examples=["anime girl walking through a cherry blossom forest, cinematic"],
    )
    anime_style: str = Field(
        default="modern-anime",
        description="Anime style hint used to enrich the prompt.",
        examples=["modern-anime", "studio-ghibli"],
    )
    duration: Literal["short", "long"] = Field(
        default="short",
        description="'short' ≈ 4 s, 'long' ≈ 8 s.",
    )


class GenerateVideoResponse(BaseModel):
    """Successful video generation payload."""

    status: Literal["success"] = "success"
    video_url: str = Field(
        ...,
        description="URL of the generated anime video (mp4).",
    )
    mode: str
    duration: str
