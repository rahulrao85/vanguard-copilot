"""Tests for the AI chat route."""

import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestChatRoute:
    @pytest.mark.asyncio
    async def test_chat_returns_200(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "Hello", "history": []},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_content_type_is_event_stream(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "What is the crowd status?", "history": []},
        )
        assert "text/event-stream" in response.headers.get("content-type", "")

    @pytest.mark.asyncio
    async def test_chat_response_contains_sse_data(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "Gate A status", "history": []},
        )
        content = response.text
        assert "data:" in content

    @pytest.mark.asyncio
    async def test_chat_response_ends_with_done(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "Help", "history": []},
        )
        assert "[DONE]" in response.text

    @pytest.mark.asyncio
    async def test_chat_with_history(self, client):
        response = await client.post(
            "/api/chat",
            json={
                "message": "What about Gate B?",
                "history": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"},
                ],
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_sse_chunks_are_valid_json(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "Status update", "history": []},
        )
        lines = response.text.split("\n")
        data_lines = [ln for ln in lines if ln.startswith("data:") and "[DONE]" not in ln]
        for line in data_lines:
            payload = line[5:].strip()
            parsed = json.loads(payload)
            assert "chunk" in parsed

    @pytest.mark.asyncio
    async def test_chat_missing_message_returns_422(self, client):
        response = await client.post(
            "/api/chat",
            json={"history": []},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_chat_empty_message_allowed(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "", "history": []},
        )
        # Empty message goes through the route; fallback handles it
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_default_history_is_empty(self, client):
        """Message without history key should use default empty list."""
        response = await client.post(
            "/api/chat",
            json={"message": "Quick question"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_has_cache_control_header(self, client):
        response = await client.post(
            "/api/chat",
            json={"message": "Test", "history": []},
        )
        assert response.headers.get("cache-control") == "no-cache"
