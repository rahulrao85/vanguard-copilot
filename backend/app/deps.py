import os

from app.config import settings
from app.repository.base import AbstractRepository
from app.repository.sqlite import SqliteRepository
from app.services.gemini import GeminiService

_repository_instance: AbstractRepository | None = None
_gemini_service_instance: GeminiService | None = None


def _get_repository() -> AbstractRepository:
    global _repository_instance
    if _repository_instance is None:
        is_cloud_run = os.getenv("K_SERVICE") is not None
        if settings.use_firestore or settings.firestore_emulator_host or is_cloud_run:
            from app.repository.firestore import FirestoreRepository

            _repository_instance = FirestoreRepository()
        else:
            _repository_instance = SqliteRepository(db_path=settings.sqlite_db_path)
    return _repository_instance


def get_repository() -> AbstractRepository:
    return _get_repository()


def get_gemini_service() -> GeminiService:
    global _gemini_service_instance
    if _gemini_service_instance is None:
        _gemini_service_instance = GeminiService()
    return _gemini_service_instance
