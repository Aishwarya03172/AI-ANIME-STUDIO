"""API route modules."""

from app.routes.generate import router as generate_router
from app.routes.video import router as video_router

__all__ = ["generate_router", "video_router"]
