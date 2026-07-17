"""
Health check route for infrastructure monitoring and load balancer probes.
"""

from fastapi import APIRouter, Depends

from app.deps import get_gemini_service, get_repository
from app.repository.base import AbstractRepository
from app.services.gemini import GeminiService

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health check endpoint")
async def health_check(
    repo: AbstractRepository = Depends(get_repository),
    gemini: GeminiService = Depends(get_gemini_service),
) -> dict[str, object]:
    """Return the health status of the application and its dependencies."""
    db_healthy = await repo.health_check()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "gemini_configured": gemini._configured,
        "version": "1.0.0",
    }
