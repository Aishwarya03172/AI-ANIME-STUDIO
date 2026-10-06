"""
AI Anime Studio — FastAPI backend.

Run from the `backend/` directory:

    python -m venv .venv
    source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
    pip install -r requirements.txt
    cp .env.example .env
    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

# Package marker for the FastAPI application.
