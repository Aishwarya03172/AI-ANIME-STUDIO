"""
Anime generation service.

Delegates to `app.services.replicate.generate_anime` while preserving the
existing FastAPI response contract:

    {"status": "success", "image_url": "..."}
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import HTTPException, status

from app.models.generate import GenerateAnimeRequest, GenerateAnimeResponse
from app.services.replicate import (
    InvalidImageUrlError,
    ReplicateConfigError,
    ReplicateGenerationError,
    ReplicateTimeoutError,
    generate_anime,
)

logger = logging.getLogger(__name__)

# Match the wait budget used inside the Replicate client.
_GENERATION_TIMEOUT_SECONDS = 180


async def generate_anime_image(
    payload: GenerateAnimeRequest,
) -> GenerateAnimeResponse:
    """
    Generate an anime-styled image from `payload` via Replicate.

    Routes stay unchanged — they call this function and receive the same
    `GenerateAnimeResponse` shape as before.
    """
    image_url = str(payload.image_url)
    anime_style = payload.anime_style
    quality = payload.quality

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                generate_anime,
                image_url,
                anime_style,
                quality,
                timeout_seconds=_GENERATION_TIMEOUT_SECONDS,
            ),
            timeout=_GENERATION_TIMEOUT_SECONDS + 5,
        )
    except asyncio.TimeoutError as exc:
        logger.error("Anime generation timed out for style=%s", anime_style)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Anime generation timed out. Please try again.",
        ) from exc
    except InvalidImageUrlError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except ReplicateConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ReplicateTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(exc),
        ) from exc
    except ReplicateGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return GenerateAnimeResponse(
        status="success",
        image_url=result["image_url"],
    )
