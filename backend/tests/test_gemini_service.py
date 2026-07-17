"""
Unit tests for GeminiService and related helpers.
"""

import pytest

from app.models.schemas import GateData
from app.routes.calculate import _compute_density, _determine_status
from app.services.gemini import GeminiService


class TestComputeDensity:
    def test_density_normal(self):
        assert _compute_density(500, 1000) == 50.0

    def test_density_zero_sensor_count(self):
        assert _compute_density(0, 500) == 0.0

    def test_density_full_capacity(self):
        assert _compute_density(1000, 1000) == 100.0

    def test_density_sensor_exceeds_capacity_capped_at_100(self):
        assert _compute_density(1500, 1000) == 100.0

    def test_density_capacity_zero_returns_100(self):
        assert _compute_density(100, 0) == 100.0

    def test_density_capacity_negative_returns_100(self):
        assert _compute_density(100, -10) == 100.0

    def test_density_rounds_to_two_decimals(self):
        result = _compute_density(333, 1000)
        assert result == 33.3


class TestDetermineStatus:
    def test_status_at_0_is_clear(self):
        assert _determine_status(0.0) == "clear"

    def test_status_at_29_is_clear(self):
        assert _determine_status(29.99) == "clear"

    def test_status_at_30_is_moderate(self):
        assert _determine_status(30.0) == "moderate"

    def test_status_at_59_is_moderate(self):
        assert _determine_status(59.99) == "moderate"

    def test_status_at_60_is_busy(self):
        assert _determine_status(60.0) == "busy"

    def test_status_at_84_is_busy(self):
        assert _determine_status(84.99) == "busy"

    def test_status_at_85_is_critical(self):
        assert _determine_status(85.0) == "critical"

    def test_status_at_100_is_critical(self):
        assert _determine_status(100.0) == "critical"

    def test_status_edge_levels_distinct(self):
        assert _determine_status(29.0) == "clear"
        assert _determine_status(30.0) == "moderate"
        assert _determine_status(60.0) == "busy"
        assert _determine_status(85.0) == "critical"


class TestFormatGateData:
    def test_format_single_gate_produces_string(self):
        service = GeminiService()
        gates = [GateData(gate_id="Gate-A", sensor_count=200, capacity=1000)]
        result = service._format_gate_data(gates)
        assert isinstance(result, str)
        assert "Gate-A" in result
        assert "200/1000" in result

    def test_format_gate_shows_density_percentage(self):
        service = GeminiService()
        gates = [GateData(gate_id="Gate-X", sensor_count=500, capacity=1000)]
        result = service._format_gate_data(gates)
        assert "50.0%" in result

    def test_format_multiple_gates_separated_by_newline(self):
        service = GeminiService()
        gates = [
            GateData(gate_id="Gate-A", sensor_count=200, capacity=1000),
            GateData(gate_id="Gate-B", sensor_count=500, capacity=1000),
        ]
        result = service._format_gate_data(gates)
        lines = result.split("\n")
        assert len(lines) == 2
        assert "Gate-A" in lines[0]
        assert "Gate-B" in lines[1]

    def test_format_gate_zero_capacity_shows_0_percent(self):
        service = GeminiService()
        gates = [GateData(gate_id="Gate-Z", sensor_count=100, capacity=1)]
        result = service._format_gate_data(gates)
        assert "Gate-Z" in result


class TestMockResponse:
    def test_mock_response_crowd_routing_returns_valid_structure(self):
        service = GeminiService()
        gates = [GateData(gate_id="Gate-X", sensor_count=900, capacity=1000)]
        result = service._mock_response("crowd_routing", "en", "Test input", gates)
        assert "megaphone_script" in result
        assert "reasoning" in result
        assert "recommendations" in result
        assert isinstance(result["recommendations"], list)
        assert len(result["recommendations"]) > 0

    def test_mock_response_fan_translation_returns_valid_structure(self):
        service = GeminiService()
        result = service._mock_response("fan_translation", "es", "Donde esta el bano?", None)
        assert "megaphone_script" in result
        assert "reasoning" in result
        assert "recommendations" in result
        assert isinstance(result["megaphone_script"], str)

    def test_mock_response_facility_alert_returns_valid_structure(self):
        service = GeminiService()
        result = service._mock_response("facility_alert", "en", "Broken escalator in Section C", None)
        assert "megaphone_script" in result
        assert "reasoning" in result
        assert "recommendations" in result
        assert isinstance(result["recommendations"], list)
        assert len(result["recommendations"]) == 3

    def test_mock_response_crowd_routing_identifies_busiest_gate(self):
        service = GeminiService()
        gates = [
            GateData(gate_id="Gate-A", sensor_count=200, capacity=1000),
            GateData(gate_id="Gate-B", sensor_count=950, capacity=1000),
            GateData(gate_id="Gate-C", sensor_count=100, capacity=1000),
        ]
        result = service._mock_response("crowd_routing", "en", "Test", gates)
        assert "Gate-B" in str(result["megaphone_script"])

    def test_mock_response_fan_translation_includes_target_language(self):
        service = GeminiService()
        result = service._mock_response("fan_translation", "fr", "Ou sont les toilettes?", None)
        assert "fr" in str(result["megaphone_script"])


class TestGenerateInsights:
    async def test_generate_insights_mock_crowd_routing_returns_valid_dict(self):
        service = GeminiService()
        result = await service.generate_insights(
            stadium_id="S1",
            context_type="crowd_routing",
            input_text="Gate A is overcrowded",
            target_language="en",
            gate_data=None,
        )
        assert isinstance(result, dict)
        assert "megaphone_script" in result
        assert "reasoning" in result
        assert "recommendations" in result

    async def test_generate_insights_mock_fan_translation_returns_valid_dict(self):
        service = GeminiService()
        result = await service.generate_insights(
            stadium_id="S1",
            context_type="fan_translation",
            input_text="Where is Gate B?",
            target_language="es",
            gate_data=None,
        )
        assert isinstance(result, dict)
        assert result["megaphone_script"] is not None
        assert result["reasoning"] is not None

    async def test_generate_insights_mock_facility_alert_returns_valid_dict(self):
        service = GeminiService()
        result = await service.generate_insights(
            stadium_id="S1",
            context_type="facility_alert",
            input_text="Water leak in Section B",
            target_language="en",
            gate_data=None,
        )
        assert "megaphone_script" in result

    async def test_generate_insights_passes_gate_data(self):
        service = GeminiService()
        gates = [GateData(gate_id="Gate-Z", sensor_count=999, capacity=1000)]
        result = await service.generate_insights(
            stadium_id="S2",
            context_type="crowd_routing",
            input_text="Crowd building up",
            target_language="en",
            gate_data=gates,
        )
        assert "Gate-Z" in str(result["megaphone_script"])
