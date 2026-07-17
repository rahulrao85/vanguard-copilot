"""
Tests for the /api/calculate endpoint covering normal and error cases.
"""

import pytest


class TestCalculateSuccess:
    """Happy-path tests for the calculate endpoint."""

    async def test_calculate_with_multiple_gates(self, async_client, valid_calculate_payload):
        """Should return correct density and status for multiple gates."""
        response = await async_client.post("/api/calculate", json=valid_calculate_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["stadium_id"] == "STADIUM-001"
        assert len(data["gates"]) == 3
        assert "overall_density_percent" in data
        assert "total_people" in data
        assert "total_capacity" in data
        assert "timestamp" in data

    async def test_calculate_gate_status_clear(self, async_client):
        """Gate with low density should return 'clear' status."""
        payload = {
            "stadium_id": "S1",
            "gates": [{"gate_id": "G1", "sensor_count": 10, "capacity": 1000}],
        }
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 200
        gate = response.json()["gates"][0]
        assert gate["status"] == "clear"
        assert gate["density_percent"] == 1.0

    async def test_calculate_gate_status_critical(self, async_client):
        """Gate with very high density should return 'critical' status."""
        payload = {
            "stadium_id": "S1",
            "gates": [{"gate_id": "G1", "sensor_count": 950, "capacity": 1000}],
        }
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 200
        gate = response.json()["gates"][0]
        assert gate["status"] == "critical"

    async def test_calculate_with_single_gate(self, async_client):
        """Single gate should produce valid output."""
        payload = {
            "stadium_id": "S1",
            "gates": [{"gate_id": "G-Solo", "sensor_count": 500, "capacity": 1000}],
        }
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 200
        assert response.json()["total_people"] == 500

    async def test_calculate_response_includes_timestamp(self, async_client, valid_calculate_payload):
        """Response should always include an ISO timestamp."""
        response = await async_client.post("/api/calculate", json=valid_calculate_payload)
        assert response.status_code == 200
        assert "timestamp" in response.json()
        assert "T" in response.json()["timestamp"]


class TestCalculateErrors:
    """Error-case tests for the calculate endpoint."""

    async def test_calculate_empty_gates(self, async_client):
        """Empty gates list should return 422 validation error."""
        payload = {"stadium_id": "S1", "gates": []}
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 422

    async def test_calculate_missing_stadium_id(self, async_client):
        """Missing stadium_id should return 422."""
        payload = {"gates": [{"gate_id": "G1", "sensor_count": 10, "capacity": 100}]}
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 422

    async def test_calculate_missing_gates(self, async_client):
        """Missing gates field should return 422."""
        payload = {"stadium_id": "S1"}
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 422

    async def test_calculate_negative_sensor_count(self, async_client):
        """Negative sensor count should return 422 validation error."""
        payload = {
            "stadium_id": "S1",
            "gates": [{"gate_id": "G1", "sensor_count": -5, "capacity": 100}],
        }
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 422

    async def test_calculate_zero_capacity(self, async_client):
        """Zero capacity should return 422 validation error (ge=1 constraint)."""
        payload = {
            "stadium_id": "S1",
            "gates": [{"gate_id": "G1", "sensor_count": 50, "capacity": 0}],
        }
        response = await async_client.post("/api/calculate", json=payload)
        assert response.status_code == 422

    async def test_calculate_invalid_json(self, async_client):
        """Malformed JSON should return 422."""
        response = await async_client.post(
            "/api/calculate",
            content=b"not valid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code >= 400
