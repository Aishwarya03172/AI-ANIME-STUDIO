"""
FastAPI entrypoint for AI Anime Studio.

Start (from `backend/`):

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import generate_router, video_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Backend API for AI Anime Studio. "
        "POST /generate-anime uses Replicate (token from backend/.env)."
    ),
)

# Basic structured logging for local development / containers.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

# Allow the Expo web/dev clients to call this API during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router)
app.include_router(video_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Simple health check for deploy / local smoke tests."""
    return {"status": "ok"}
