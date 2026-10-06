# AI Anime Studio — FastAPI Backend

Mock anime-generation API for the Expo app. Replicate can be plugged in later without changing the HTTP contract.

## Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app + CORS + routers
│   ├── config.py        # python-dotenv settings (no hardcoded secrets)
│   ├── routes/          # HTTP endpoints
│   ├── services/        # Business logic (mock → Replicate later)
│   ├── models/          # Pydantic request/response schemas
│   └── utils/           # Shared helpers
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` when you are ready for Replicate:

```
REPLICATE_API_TOKEN=your_token_here
PORT=8000
```

## Run

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/health  

## Endpoint

### `POST /generate-anime`

**Request**

```json
{
  "image_url": "https://example.com/photo.jpg",
  "anime_style": "modern-anime"
}
```

**Response (mock)**

```json
{
  "status": "success",
  "image_url": "https://example.com/generated-image.png"
}
```

## Replicate

1. Put your token in `.env` as `REPLICATE_API_TOKEN` (never commit it).
2. `app/services/replicate.py` loads each model's live OpenAPI schema and builds inputs dynamically.
3. Quality mapping:
   - `fast` → `zf-kbot/photo-to-anime`
   - `premium` → `datacte/flux-aesthetic-anime`
4. `app/services/anime.py` wraps that client and keeps the HTTP response shape unchanged.
