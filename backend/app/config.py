"""
Application configuration.

Environment variables are loaded from `backend/.env` via python-dotenv.
Never hardcode secrets (especially REPLICATE_API_TOKEN).
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load `.env` from the backend project root (parent of `app/`).
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    """Runtime settings from environment variables."""

    # Used by services/replicate integration (added later) — do not hardcode.
    replicate_api_token: str
    port: int
    app_name: str = "AI Anime Studio API"
    app_version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        replicate_api_token=os.getenv("REPLICATE_API_TOKEN", "").strip(),
        port=int(os.getenv("PORT", "8000")),
    )
