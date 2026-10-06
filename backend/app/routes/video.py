"""Anime video generation HTTP routes."""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, HTTPException, status

from app.models.video import GenerateVideoRequest, GenerateVideoResponse
from app.services.video import (
    generate_video_from_image,
    generate_video_from_text,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["video"])

_TIMEOUT = 310  # slightly over the service timeout


@router.post(
    "/generate-video",
    response_model=GenerateVideoResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate an anime video from an image or text prompt",
)
async def generate_video(payload: GenerateVideoRequest) -> GenerateVideoResponse:
    """
    - **mode=image**: animate an existing anime image → short video clip
    - **mode=text**: generate an anime video from a text description
    """
    mode = payload.mode
    anime_style = payload.anime_style or "modern-anime"
    duration = payload.duration or "short"

    try:
        if mode == "image":
            if not payload.image_url:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="image_url is required when mode is 'image'",
                )
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    generate_video_from_image,
                    str(payload.image_url),
                    anime_style,
                    duration,
                ),
                timeout=_TIMEOUT,
            )
        else:  # text
            if not payload.prompt:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="prompt is required when mode is 'text'",
                )
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    generate_video_from_text,
                    payload.prompt,
                    anime_style,
                    duration,
                ),
                timeout=_TIMEOUT,
            )

    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Video generation timed out. Please try again.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return GenerateVideoResponse(
        status="success",
        video_url=result["video_url"],
        mode=result["mode"],
        duration=result["duration"],
    )
