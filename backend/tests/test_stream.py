"""Tests for SSE stream and demo mode API routes."""

import json
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestDemoRoutes:
    @pytest.mark.asyncio
    async def test_demo_start_returns_200(self, client):
        response = await client.post("/api/demo/start")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_demo_start_returns_state(self, client):
        response = await client.post("/api/demo/start")
        data = response.json()
        assert "gates" in data
        assert "step" in data
        assert data["step"] == 0

    @pytest.mark.asyncio
    async def test_demo_next_advances_step(self, client):
        await client.post("/api/demo/reset")
        response = await client.post("/api/demo/next")
        assert response.status_code == 200
        data = response.json()
        assert data["step"] == 1

    @pytest.mark.asyncio
    async def test_demo_prev_does_not_go_below_zero(self, client):
        await client.post("/api/demo/reset")
        response = await client.post("/api/demo/prev")
        assert response.status_code == 200
        data = response.json()
        assert data["step"] == 0

    @pytest.mark.asyncio
    async def test_demo_reset_returns_to_step_zero(self, client):
        await client.post("/api/demo/next")
        await client.post("/api/demo/next")
        response = await client.post("/api/demo/reset")
        assert response.status_code == 200
        data = response.json()
        assert data["step"] == 0

    @pytest.mark.asyncio
    async def test_demo_status_returns_step_and_total(self, client):
        await client.post("/api/demo/reset")
        response = await client.get("/api/demo/status")
        assert response.status_code == 200
        data = response.json()
        assert "step" in data
        assert "total_steps" in data
        assert "state" in data

    @pytest.mark.asyncio
    async def test_demo_status_total_is_20(self, client):
        response = await client.get("/api/demo/status")
        assert response.json()["total_steps"] == 20

    @pytest.mark.asyncio
    async def test_demo_state_has_event_label(self, client):
        response = await client.post("/api/demo/start")
        data = response.json()
        assert "event" in data
        assert len(data["event"]) > 0

    @pytest.mark.asyncio
    async def test_demo_state_has_gates(self, client):
        response = await client.post("/api/demo/start")
        data = response.json()
        assert isinstance(data["gates"], dict)
        assert len(data["gates"]) == 16

    @pytest.mark.asyncio
    async def test_demo_gate_values_in_range(self, client):
        response = await client.post("/api/demo/start")
        for pct in response.json()["gates"].values():
            assert 0 <= pct <= 100
