from app.repository.memory import InMemoryRepository
from app.repository.firestore import FirestoreRepository
from app.repository.sqlite import SqliteRepository
from app.repository.base import AbstractRepository
from app.services.gemini import GeminiService
from app.config import settings

_repository_instance: AbstractRepository | None = None
_gemini_service_instance: GeminiService | None = None


def _get_repository() -> AbstractRepository:
    global _repository_instance
    if _repository_instance is None:
        if settings.firestore_emulator_host:
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
