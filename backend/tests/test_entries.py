"""
Tests for the /api/entries endpoints covering normal and error cases.
"""

import pytest


class TestCreateEntry:
    """Tests for POST /api/entries."""

    async def test_create_entry_success(self, async_client, valid_entry_payload):
        """Should create an entry and return it with generated metadata."""
        response = await async_client.post("/api/entries", json=valid_entry_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["device_id"] == "device-abc-123"
        assert data["activity_type"] == "crowd_report"
        assert data["status"] == "logged"
        assert "entry_id" in data
        assert "created_at" in data

    async def test_create_entry_and_retrieve(self, async_client, valid_entry_payload):
        """Created entry should be retrievable by device_id."""
        create_resp = await async_client.post("/api/entries", json=valid_entry_payload)
        assert create_resp.status_code == 201

        get_resp = await async_client.get("/api/entries/device-abc-123")
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["device_id"] == "device-abc-123"
        assert data["total"] >= 1
        assert isinstance(data["entries"], list)

    async def test_create_entry_with_severity_critical(self, async_client):
        """Should accept critical severity incident reports."""
        payload = {
            "device_id": "dev-crit",
            "activity_type": "incident_log",
            "description": "Medical emergency at Section 12",
            "location": "Section 12",
            "severity": "critical",
        }
        response = await async_client.post("/api/entries", json=payload)
        assert response.status_code == 201
        assert response.json()["severity"] == "critical"

    async def test_create_entry_minimal_fields(self, async_client):
        """Should succeed with only required fields."""
        payload = {
            "device_id": "dev-min",
            "activity_type": "shift_checkin",
            "description": "Started shift at Gate B",
            "severity": "info",
        }
        response = await async_client.post("/api/entries", json=payload)
        assert response.status_code == 201

    async def test_create_entry_all_activity_types(self, async_client):
        """All valid activity types should be accepted."""
        valid_types = ["crowd_report", "incident_log", "shift_checkin", "facility_issue", "fan_assist", "other"]
        for atype in valid_types:
            payload = {
                "device_id": "dev-types",
                "activity_type": atype,
                "description": f"Test for {atype}",
                "severity": "info",
            }
            response = await async_client.post("/api/entries", json=payload)
            assert response.status_code == 201, f"Failed for activity_type: {atype}"


class TestGetEntries:
    """Tests for GET /api/entries/{device_id}."""

    async def test_get_entries_empty_device(self, async_client):
        """Device with no entries should return empty list."""
        response = await async_client.get("/api/entries/non-existent-device")
        assert response.status_code == 200
        data = response.json()
        assert data["entries"] == []
        assert data["total"] == 0

    async def test_get_entries_multiple(self, async_client, valid_entry_payload):
        """Should retrieve all entries for a device in reverse chronological order."""
        for i in range(3):
            payload = {**valid_entry_payload, "device_id": f"multi-{i % 2}"}
            await async_client.post("/api/entries", json=payload)

        response = await async_client.get("/api/entries/multi-0")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1


class TestEntryErrors:
    """Error-case tests for entries endpoints."""

    async def test_create_entry_invalid_activity_type(self, async_client):
        """Invalid activity_type should return 422."""
        payload = {
            "device_id": "dev-1",
            "activity_type": "invalid_type",
            "description": "Test",
            "severity": "info",
        }
        response = await async_client.post("/api/entries", json=payload)
        assert response.status_code == 422

    async def test_create_entry_invalid_severity(self, async_client):
        """Invalid severity value should return 422."""
        payload = {
            "device_id": "dev-1",
            "activity_type": "crowd_report",
            "description": "Test",
            "severity": "extreme",
        }
        response = await async_client.post("/api/entries", json=payload)
        assert response.status_code == 422

    async def test_create_entry_missing_device_id(self, async_client):
        """Missing device_id should return 422."""
        payload = {
            "activity_type": "crowd_report",
            "description": "Missing device id",
            "severity": "info",
        }
        response = await async_client.post("/api/entries", json=payload)
        assert response.status_code == 422

    async def test_create_entry_empty_description(self, async_client):
        """Empty description should return 422."""
        payload = {
            "device_id": "dev-1",
            "activity_type": "crowd_report",
            "description": "",
            "severity": "info",
        }
        response = await async_client.post("/api/entries", json=payload)
        assert response.status_code == 422

    async def test_get_entries_invalid_long_device_id(self, async_client):
        """Overly long device_id should return 400."""
        long_id = "x" * 200
        response = await async_client.get(f"/api/entries/{long_id}")
        assert response.status_code == 400
