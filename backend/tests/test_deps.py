"""
Tests for dependency injection providers.
"""

import pytest

from app.deps import get_repository, get_gemini_service
from app.repository.base import AbstractRepository
from app.repository.memory import InMemoryRepository
from app.services.gemini import GeminiService


class TestGetRepository:
    def test_get_repository_returns_abstract_repository_instance(self):
        repo = get_repository()
        assert isinstance(repo, AbstractRepository)

    def test_get_repository_returns_in_memory_repository_when_no_firestore(self):
        repo = get_repository()
        assert isinstance(repo, InMemoryRepository)

    def test_get_repository_singleton_calling_twice_returns_same_instance(self):
        repo1 = get_repository()
        repo2 = get_repository()
        assert repo1 is repo2

    def test_get_repository_singleton_returns_same_type(self):
        repo1 = get_repository()
        repo2 = get_repository()
        assert type(repo1) is type(repo2)


class TestGetGeminiService:
    def test_get_gemini_service_returns_gemini_service_instance(self):
        service = get_gemini_service()
        assert isinstance(service, GeminiService)

    def test_get_gemini_service_singleton_calling_twice_returns_same_instance(self):
        svc1 = get_gemini_service()
        svc2 = get_gemini_service()
        assert svc1 is svc2

    def test_get_gemini_service_has_configured_attribute(self):
        service = get_gemini_service()
        assert hasattr(service, "_configured")

    def test_get_gemini_service_new_instance_after_reset(self, memory_repo):
        import app.deps as deps
        deps._gemini_service_instance = None
        svc1 = get_gemini_service()
        deps._gemini_service_instance = None
        svc2 = get_gemini_service()
        assert svc1 is not svc2
