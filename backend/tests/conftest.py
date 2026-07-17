"""
Pytest fixtures for the backend test suite.
Provides shared test clients, repository instances, and mock data.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.repository.memory import InMemoryRepository


@pytest.fixture
async def async_client():
    """Provide an async HTTP client for testing the FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def memory_repo():
    """Provide a fresh in-memory repository instance for each test."""
    repo = InMemoryRepository()
    return repo


@pytest.fixture(autouse=True)
async def reset_globals():
    """Reset global singletons before each test to ensure test isolation."""
    import app.deps as deps
    deps._repository_instance = None
    deps._gemini_service_instance = None
    yield
    deps._repository_instance = None
    deps._gemini_service_instance = None


@pytest.fixture
def valid_calculate_payload():
    """Provide a valid payload for the /api/calculate endpoint."""
    return {
        "stadium_id": "STADIUM-001",
        "gates": [
            {"gate_id": "Gate-A", "sensor_count": 200, "capacity": 1000},
            {"gate_id": "Gate-B", "sensor_count": 750, "capacity": 1000},
            {"gate_id": "Gate-C", "sensor_count": 50, "capacity": 500},
        ],
    }


@pytest.fixture
def valid_entry_payload():
    """Provide a valid payload for the /api/entries endpoint."""
    return {
        "device_id": "device-abc-123",
        "activity_type": "crowd_report",
        "description": "Gate A crowd level increasing steadily",
        "location": "North Entrance - Gate A",
        "severity": "warning",
    }


@pytest.fixture
def valid_insights_payload():
    """Provide a valid payload for the /api/insights endpoint."""
    return {
        "stadium_id": "STADIUM-001",
        "context_type": "crowd_routing",
        "input_text": "Gate A is overcrowded with 2000 fans waiting",
        "target_language": "es",
        "gate_data": [
            {"gate_id": "Gate-A", "sensor_count": 2000, "capacity": 2000},
            {"gate_id": "Gate-C", "sensor_count": 100, "capacity": 2000},
        ],
    }
