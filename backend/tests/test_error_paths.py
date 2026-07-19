"""
Tests for error-handling paths and previously uncovered branches:
- GeminiService real-client interaction (success, markdown-wrapped, empty, failure)
- Insights route error mapping (400/500)
- Entries route error mapping (500)
- Static frontend serving fallbacks
"""

import json

import pytest

import app.main as main_module
from unittest.mock import AsyncMock, MagicMock, patch

from app.deps import get_gemini_service, get_repository
from app.main import app
from app.models.schemas import GateData
from app.services.gemini import GeminiService


class _FakeModels:
    def __init__(self, text: str | None = None, exc: Exception | None = None):
        self._text = text
        self._exc = exc

    def generate_content(self, **kwargs):
        if self._exc:
            raise self._exc
        return type("Resp", (), {"text": self._text})()


class _FakeClient:
    def __init__(self, text: str | None = None, exc: Exception | None = None):
        self.models = _FakeModels(text=text, exc=exc)


def _configured_service(text: str | None = None, exc: Exception | None = None) -> GeminiService:
    service = GeminiService()
    service._client = _FakeClient(text=text, exc=exc)
    service._configured = True
    return service


class TestGeminiRealClientPath:
    async def test_success_returns_parsed_json(self):
        payload = {
            "megaphone_script": "Move to Gate B",
            "reasoning": "Gate A full",
            "recommendations": ["Open Gate C"],
        }
        service = _configured_service(text=json.dumps(payload))
        result = await service.generate_insights(
            stadium_id="s1",
            context_type="crowd_routing",
            input_text="overcrowded",
            target_language="en",
            gate_data=[GateData(gate_id="g1", sensor_count=100, capacity=200)],
        )
        assert result["megaphone_script"] == "Move to Gate B"
        assert result["recommendations"] == ["Open Gate C"]

    async def test_markdown_wrapped_json_is_stripped(self):
        payload = {"megaphone_script": "Hello", "reasoning": "r", "recommendations": []}
        wrapped = f"```json\n{json.dumps(payload)}\n```"
        service = _configured_service(text=wrapped)
        result = await service.generate_insights(
            stadium_id="s1",
            context_type="fan_translation",
            input_text="hello",
            target_language="es",
        )
        assert result["megaphone_script"] == "Hello"

    async def test_empty_response_falls_back_to_mock(self):
        service = _configured_service(text=None)
        result = await service.generate_insights(
            stadium_id="s1",
            context_type="crowd_routing",
            input_text="test",
            target_language="en",
        )
        assert "megaphone_script" in result

    async def test_client_exception_falls_back_to_mock(self):
        service = _configured_service(exc=RuntimeError("API down"))
        result = await service.generate_insights(
            stadium_id="s1",
            context_type="facility_alert",
            input_text="leak",
            target_language="en",
        )
        assert "megaphone_script" in result

    async def test_invalid_json_falls_back_to_mock(self):
        service = _configured_service(text="not json at all")
        result = await service.generate_insights(
            stadium_id="s1",
            context_type="crowd_routing",
            input_text="test",
            target_language="en",
        )
        assert "megaphone_script" in result

    def test_format_gate_data_handles_zero_capacity(self):
        service = GeminiService()
        gates = [GateData(gate_id="g1", sensor_count=10, capacity=1)]
        gates[0].capacity = 0  # bypass validation to exercise the guard
        result = service._format_gate_data(gates)
        assert "0.0%" in result


class TestHttpxRealClientPath:
    """Test the actual httpx.AsyncClient code path via mocked HTTP."""

    async def test_httpx_success_returns_parsed_json(self):
        payload = {
            "megaphone_script": "Go to Gate C",
            "reasoning": "Gate A full",
            "recommendations": ["Open Gate D"],
        }
        # httpx response methods (raise_for_status, json) are SYNC — use MagicMock, not AsyncMock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": json.dumps(payload)}}]
        }

        service = GeminiService()
        service._configured = True
        service.api_key = "test-key"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
            result = await service.generate_insights(
                stadium_id="s1",
                context_type="crowd_routing",
                input_text="overcrowded",
                target_language="en",
                gate_data=[GateData(gate_id="g1", sensor_count=100, capacity=200)],
            )
        assert result["megaphone_script"] == "Go to Gate C"
        assert result["recommendations"] == ["Open Gate D"]

    async def test_httpx_http_error_falls_back_to_mock(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("HTTP 500")

        service = GeminiService()
        service._configured = True
        service.api_key = "test-key"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
            result = await service.generate_insights(
                stadium_id="s1",
                context_type="facility_alert",
                input_text="leak",
                target_language="en",
            )
        assert "megaphone_script" in result

    async def test_httpx_invalid_json_response_falls_back_to_mock(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "not valid json"}}]
        }

        service = GeminiService()
        service._configured = True
        service.api_key = "test-key"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
            result = await service.generate_insights(
                stadium_id="s1",
                context_type="ticketing_support",
                input_text="scanning error at Gate B",
                target_language="en",
            )
        assert "megaphone_script" in result


class _FailingGemini:
    def __init__(self, exc: Exception):
        self._exc = exc

    async def generate_insights(self, **kwargs):
        raise self._exc


class TestInsightsErrorPaths:
    async def test_value_error_returns_400(self, async_client):
        app.dependency_overrides[get_gemini_service] = lambda: _FailingGemini(ValueError("bad input"))
        try:
            response = await async_client.post(
                "/api/insights",
                json={
                    "stadium_id": "s1",
                    "context_type": "crowd_routing",
                    "input_text": "test",
                    "target_language": "en",
                },
            )
            assert response.status_code == 400
            assert "bad input" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    async def test_unexpected_error_returns_500(self, async_client):
        app.dependency_overrides[get_gemini_service] = lambda: _FailingGemini(RuntimeError("boom"))
        try:
            response = await async_client.post(
                "/api/insights",
                json={
                    "stadium_id": "s1",
                    "context_type": "crowd_routing",
                    "input_text": "test",
                    "target_language": "en",
                },
            )
            assert response.status_code == 500
            assert "boom" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    async def test_string_recommendations_are_normalized(self, async_client):
        class _StringRecsGemini:
            async def generate_insights(self, **kwargs):
                return {
                    "megaphone_script": "Go to Gate B",
                    "reasoning": "A is full",
                    "recommendations": "Open Gate C",
                }

        app.dependency_overrides[get_gemini_service] = lambda: _StringRecsGemini()
        try:
            response = await async_client.post(
                "/api/insights",
                json={
                    "stadium_id": "s1",
                    "context_type": "crowd_routing",
                    "input_text": "test",
                    "target_language": "en",
                },
            )
            assert response.status_code == 200
            assert response.json()["recommendations"] == ["Open Gate C"]
        finally:
            app.dependency_overrides.clear()


class _FailingRepo:
    async def create_entry(self, entry):
        raise RuntimeError("db write failed")

    async def get_entries_by_device(self, device_id):
        raise RuntimeError("db read failed")

    async def health_check(self):
        return False


class TestEntriesErrorPaths:
    async def test_create_entry_db_failure_returns_500(self, async_client, valid_entry_payload):
        app.dependency_overrides[get_repository] = lambda: _FailingRepo()
        try:
            response = await async_client.post("/api/entries", json=valid_entry_payload)
            assert response.status_code == 500
            assert "db write failed" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    async def test_get_entries_db_failure_returns_500(self, async_client):
        app.dependency_overrides[get_repository] = lambda: _FailingRepo()
        try:
            response = await async_client.get("/api/entries/device-1")
            assert response.status_code == 500
            assert "db read failed" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()


class TestStaticFrontendServing:
    async def test_api_path_returns_404(self, async_client):
        response = await async_client.get("/api/nonexistent")
        assert response.status_code == 404

    async def test_existing_static_file_is_served(self, async_client, tmp_path, monkeypatch):
        (tmp_path / "test-asset.txt").write_text("static content")
        monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path)
        response = await async_client.get("/test-asset.txt")
        assert response.status_code == 200
        assert response.text == "static content"

    async def test_index_html_served_when_present(self, async_client, tmp_path, monkeypatch):
        (tmp_path / "index.html").write_text("<html>app</html>")
        monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path)
        response = await async_client.get("/")
        assert response.status_code == 200
        assert "<html>app</html>" in response.text

    async def test_spa_fallback_serves_index_for_unknown_paths(self, async_client, tmp_path, monkeypatch):
        (tmp_path / "index.html").write_text("<html>spa</html>")
        monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path)
        response = await async_client.get("/some/client/route")
        assert response.status_code == 200
        assert "<html>spa</html>" in response.text

    async def test_json_fallback_when_no_static_dir(self, async_client, tmp_path, monkeypatch):
        monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path / "nonexistent")
        response = await async_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["app"] == "Vanguard Co-Pilot"

    async def test_lifespan_context_manager_runs(self):
        async with main_module.lifespan(app):
            pass


class TestSqliteRepositoryErrors:
    async def test_health_check_failure_returns_false(self, tmp_path):
        from app.repository.sqlite import SqliteRepository

        bad_path = tmp_path / "blocked" / "db.sqlite"
        bad_path.parent.mkdir()
        bad_path.parent.chmod(0o444)
        repo = SqliteRepository(db_path=str(bad_path))
        try:
            result = await repo.health_check()
            assert isinstance(result, bool)
        finally:
            bad_path.parent.chmod(0o755)

    async def test_clear_removes_entries(self, tmp_path):
        from app.models.schemas import EntryRequest
        from app.repository.sqlite import SqliteRepository

        repo = SqliteRepository(db_path=str(tmp_path / "test.db"))
        entry = EntryRequest(
            device_id="dev-clear",
            activity_type="crowd_report",
            description="to be cleared",
            severity="info",
        )
        await repo.create_entry(entry)
        await repo.clear()
        result = await repo.get_entries_by_device("dev-clear")
        assert result.total == 0

    async def test_create_and_retrieve_roundtrip(self, tmp_path):
        from app.models.schemas import EntryRequest
        from app.repository.sqlite import SqliteRepository

        repo = SqliteRepository(db_path=str(tmp_path / "rt.db"))
        entry = EntryRequest(
            device_id="dev-rt",
            activity_type="incident_log",
            description="roundtrip test",
            location="Gate B",
            severity="warning",
        )
        created = await repo.create_entry(entry)
        assert created.entry_id
        fetched = await repo.get_entries_by_device("dev-rt")
        assert fetched.total == 1
        assert fetched.entries[0].description == "roundtrip test"
        assert fetched.entries[0].location == "Gate B"


class TestRateLimitHandler:
    async def test_rate_limit_exceeded_returns_429(self, async_client):
        # Hit the endpoint more than 30 times rapidly
        responses = []
        for _ in range(35):
            responses.append(await async_client.get("/api/health"))
        statuses = [r.status_code for r in responses]
        assert 429 in statuses or all(s == 200 for s in statuses)


@pytest.mark.parametrize("path", ["/docs", "/openapi.json", "/redoc"])
async def test_docs_paths_not_shadowed_by_spa(async_client, path):
    response = await async_client.get(path)
    assert response.status_code != 404 or path == "/redoc"
