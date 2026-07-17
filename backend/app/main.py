from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.rate_limit import limiter
from app.routes import calculate, entries, health, insights

MAX_PAYLOAD_BYTES = settings.max_payload_bytes
STATIC_DIR = Path("/app/static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    description="GenAI-powered stadium operations assistant for FIFA World Cup 2026 volunteers",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    csp = (
        "default-src 'self'; script-src 'self';"
        " style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    )
    response.headers["Content-Security-Policy"] = csp
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.middleware("http")
async def body_size_limit_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_PAYLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "detail": f"Request body exceeds {MAX_PAYLOAD_BYTES // 1024}KB limit",
                "error_code": "PAYLOAD_TOO_LARGE",
            },
        )
    return await call_next(request)


app.add_middleware(GZipMiddleware, minimum_size=512)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(calculate.router)
app.include_router(entries.router)
app.include_router(insights.router)
app.include_router(health.router)


@app.get("/", include_in_schema=False)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str = ""):
    if full_path:
        first = full_path.split("/")[0]
        if first in ("api", "docs", "redoc", "openapi.json", "health"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
    index = STATIC_DIR / "index.html"
    if index.is_file():
        return FileResponse(str(index))
    return JSONResponse(
        {"app": settings.app_name, "version": "1.0.0", "docs": "/docs", "health": "/health"},
    )
