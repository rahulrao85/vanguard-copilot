"""
Tests for the /health endpoint.
"""

import pytest


class TestHealthEndpoint:
    async def test_get_health_returns_200(self, async_client):
        response = await async_client.get("/health")
        assert response.status_code == 200

    async def test_health_response_has_status_field(self, async_client):
        response = await async_client.get("/health")
        data = response.json()
        assert data["status"] in ("healthy", "degraded")

    async def test_health_response_has_database_field(self, async_client):
        response = await async_client.get("/health")
        data = response.json()
        assert data["database"] in ("connected", "disconnected")

    async def test_health_response_has_gemini_configured_field(self, async_client):
        response = await async_client.get("/health")
        data = response.json()
        assert isinstance(data["gemini_configured"], bool)

    async def test_health_response_has_version_field(self, async_client):
        response = await async_client.get("/health")
        data = response.json()
        assert isinstance(data["version"], str)
        assert data["version"] == "1.0.0"

    async def test_health_response_all_expected_keys_present(self, async_client):
        response = await async_client.get("/health")
        data = response.json()
        required_keys = {"status", "database", "gemini_configured", "version"}
        assert required_keys.issubset(data.keys())
