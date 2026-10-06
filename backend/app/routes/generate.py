"""Anime generation HTTP routes."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.models.generate import GenerateAnimeRequest, GenerateAnimeResponse
from app.services.anime import generate_anime_image

router = APIRouter(tags=["generation"])


@router.post(
    "/generate-anime",
    response_model=GenerateAnimeResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate an anime-styled image",
)
async def generate_anime(
    payload: GenerateAnimeRequest,
) -> GenerateAnimeResponse:
    """
    Accept a source `image_url` and `anime_style`, return a generated image URL.

    Currently returns a mock response. Replicate will be plugged into
    `app.services.anime.generate_anime_image` later.
    """
    return await generate_anime_image(payload)
