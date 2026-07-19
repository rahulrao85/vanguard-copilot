import logging
import os
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.exceptions import AppError
from app.rate_limit import limiter
from app.routes import calculate, entries, health, insights
from app.routes.chat import router as chat_router
from app.routes.stream import router as stream_router

logger = logging.getLogger("vanguard")

MAX_PAYLOAD_BYTES = settings.max_payload_bytes
STATIC_DIR = Path("/app/static")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
    
    # Set up Google Cloud Logging if running in Cloud Run environment
    is_cloud_run = os.getenv("K_SERVICE") is not None
    if is_cloud_run:
        try:
            import google.cloud.logging
            client = google.cloud.logging.Client()
            client.setup_logging()
            logger.info("Google Cloud Logging successfully configured.")
        except Exception as e:
            logger.error(f"Failed to configure Google Cloud Logging: {e}")

    logger.info("Vanguard Co-Pilot starting — version 1.0.0")
    yield
    logger.info("Vanguard Co-Pilot shutting down")


app = FastAPI(
    title=settings.app_name,
    description="GenAI-powered stadium operations assistant for FIFA World Cup 2026 volunteers",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": exc.error_code},
    )


@app.middleware("http")
async def log_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    start = time.time()
    response = await call_next(request)
    elapsed = time.time() - start
    logger.info(
        "%s %s → %d (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed * 1000,
    )
    return response


@app.middleware("http")
async def security_headers_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
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
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


@app.middleware("http")
async def body_size_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
            if size > MAX_PAYLOAD_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": f"Request body exceeds {MAX_PAYLOAD_BYTES // 1024}KB limit",
                        "error_code": "PAYLOAD_TOO_LARGE",
                    },
                )
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid Content-Length header", "error_code": "BAD_REQUEST"},
            )

    body_length = 0
    original_receive = request._receive

    async def new_receive() -> dict[str, object]:
        nonlocal body_length
        message = await original_receive()
        if message["type"] == "http.request":
            body = message.get("body", b"")
            body_length += len(body)
            if body_length > MAX_PAYLOAD_BYTES:
                raise ValueError("Payload size limit exceeded")
        return message

    request._receive = new_receive

    try:
        return await call_next(request)
    except ValueError as e:
        if str(e) == "Payload size limit exceeded":
            return JSONResponse(
                status_code=413,
                content={
                    "detail": f"Request body exceeds {MAX_PAYLOAD_BYTES // 1024}KB limit",
                    "error_code": "PAYLOAD_TOO_LARGE",
                },
            )
        raise


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
app.include_router(chat_router)
app.include_router(stream_router)


@app.get("/", include_in_schema=False)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str = "") -> Response:
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
