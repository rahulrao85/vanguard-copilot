"""
Integration tests for security headers, root endpoint, and body size limits.
"""

import pytest


class TestSecurityHeaders:
    @pytest.mark.parametrize(
        "method,url,kwargs",
        [
            ("get", "/health", {}),
            ("get", "/", {}),
            ("post", "/api/calculate", {"json": {"stadium_id": "S1", "gates": [{"gate_id": "G1", "sensor_count": 10, "capacity": 100}]}}),
            ("get", "/api/entries/device-1", {}),
        ],
    )
    async def test_security_headers_present_on_all_endpoints(self, async_client, method, url, kwargs):
        client_method = getattr(async_client, method)
        response = await client_method(url, **kwargs)
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("referrer-policy") == "no-referrer"

    async def test_content_security_policy_header_present(self, async_client):
        response = await async_client.get("/health")
        assert "content-security-policy" in response.headers
        csp = response.headers["content-security-policy"]
        assert "default-src" in csp

    async def test_x_content_type_options_is_nosniff(self, async_client):
        response = await async_client.get("/health")
        assert response.headers["x-content-type-options"] == "nosniff"

    async def test_x_frame_options_is_deny(self, async_client):
        response = await async_client.get("/health")
        assert response.headers["x-frame-options"] == "DENY"

    async def test_referrer_policy_is_no_referrer(self, async_client):
        response = await async_client.get("/health")
        assert response.headers["referrer-policy"] == "no-referrer"


class TestRootEndpoint:
    async def test_root_returns_200(self, async_client):
        response = await async_client.get("/")
        assert response.status_code == 200

    async def test_root_returns_app_name(self, async_client):
        response = await async_client.get("/")
        data = response.json()
        assert data["app"] == "Vanguard Co-Pilot"

    async def test_root_returns_version(self, async_client):
        response = await async_client.get("/")
        data = response.json()
        assert data["version"] == "1.0.0"

    async def test_root_returns_docs_link(self, async_client):
        response = await async_client.get("/")
        data = response.json()
        assert data["docs"] == "/docs"

    async def test_root_returns_health_link(self, async_client):
        response = await async_client.get("/")
        data = response.json()
        assert data["health"] == "/health"


class TestBodySizeLimit:
    async def test_payload_under_64kb_succeeds(self, async_client, valid_entry_payload):
        response = await async_client.post("/api/entries", json=valid_entry_payload)
        assert response.status_code == 201

    async def test_payload_exceeding_64kb_by_header_returns_413(self, async_client):
        headers = {"Content-Length": "70000"}
        response = await async_client.post(
            "/api/entries",
            content=b"{}",
            headers=headers,
        )
        assert response.status_code == 413

    async def test_payload_exactly_at_limit_does_not_trigger_413(self, async_client):
        headers = {"Content-Length": "65536"}
        response = await async_client.post(
            "/api/entries",
            content=b"{}",
            headers=headers,
        )
        assert response.status_code != 413

    async def test_413_response_includes_error_code(self, async_client):
        headers = {"Content-Length": "70000"}
        response = await async_client.post(
            "/api/entries",
            content=b"{}",
            headers=headers,
        )
        assert response.status_code == 413
        data = response.json()
        assert "error_code" in data
