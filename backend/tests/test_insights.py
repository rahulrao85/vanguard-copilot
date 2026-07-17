"""
Tests for the POST /api/insights endpoint.
"""



class TestInsightsSuccess:
    async def test_insights_crowd_routing_returns_200(self, async_client, valid_insights_payload):
        response = await async_client.post("/api/insights", json=valid_insights_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["context_type"] == "crowd_routing"
        assert "megaphone_script" in data
        assert "reasoning" in data
        assert "recommendations" in data

    async def test_insights_fan_translation_returns_200(self, async_client):
        payload = {
            "stadium_id": "STADIUM-001",
            "context_type": "fan_translation",
            "input_text": "Where is the nearest restroom?",
            "target_language": "es",
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["context_type"] == "fan_translation"
        assert data["target_language"] == "es"

    async def test_insights_facility_alert_returns_200(self, async_client):
        payload = {
            "stadium_id": "STADIUM-002",
            "context_type": "facility_alert",
            "input_text": "Water leak detected in Section B corridor",
            "target_language": "en",
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["context_type"] == "facility_alert"

    async def test_insights_response_includes_all_expected_fields(self, async_client, valid_insights_payload):
        response = await async_client.post("/api/insights", json=valid_insights_payload)
        assert response.status_code == 200
        data = response.json()
        expected_fields = {
            "stadium_id",
            "context_type",
            "megaphone_script",
            "reasoning",
            "target_language",
            "recommendations",
            "timestamp",
        }
        assert expected_fields.issubset(data.keys())

    async def test_insights_response_timestamp_is_iso_format(self, async_client, valid_insights_payload):
        response = await async_client.post("/api/insights", json=valid_insights_payload)
        assert response.status_code == 200
        data = response.json()
        assert "T" in data["timestamp"]

    async def test_insights_recommendations_is_list(self, async_client, valid_insights_payload):
        response = await async_client.post("/api/insights", json=valid_insights_payload)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["recommendations"], list)
        assert len(data["recommendations"]) > 0


class TestInsightsErrors:
    async def test_insights_invalid_context_type_returns_422(self, async_client):
        payload = {
            "stadium_id": "STADIUM-001",
            "context_type": "invalid_context",
            "input_text": "Test input text",
            "target_language": "en",
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 422

    async def test_insights_missing_required_fields_returns_422(self, async_client):
        payload = {"stadium_id": "STADIUM-001"}
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 422

    async def test_insights_invalid_target_language_too_short_returns_422(self, async_client):
        payload = {
            "stadium_id": "STADIUM-001",
            "context_type": "crowd_routing",
            "input_text": "Test input",
            "target_language": "x",
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 422

    async def test_insights_invalid_target_language_too_long_returns_422(self, async_client):
        payload = {
            "stadium_id": "STADIUM-001",
            "context_type": "crowd_routing",
            "input_text": "Test input",
            "target_language": "x" * 11,
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 422

    async def test_insights_missing_input_text_returns_422(self, async_client):
        payload = {
            "stadium_id": "STADIUM-001",
            "context_type": "crowd_routing",
            "target_language": "en",
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 422

    async def test_insights_missing_context_type_returns_422(self, async_client):
        payload = {
            "stadium_id": "STADIUM-001",
            "input_text": "Test input",
            "target_language": "en",
        }
        response = await async_client.post("/api/insights", json=payload)
        assert response.status_code == 422
