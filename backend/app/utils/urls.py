"""URL validation helpers."""

from __future__ import annotations

from urllib.parse import urlparse


def is_http_url(value: str) -> bool:
    """Return True when `value` looks like an http(s) URL."""
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
