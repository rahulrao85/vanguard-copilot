"""
Tests for Pydantic model validation.
"""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    CalculateRequest,
    EntryRequest,
    ErrorResponse,
    GateData,
    InsightsRequest,
)


class TestGateData:
    def test_valid_gate_data(self):
        gate = GateData(gate_id="Gate-A", sensor_count=200, capacity=1000)
        assert gate.gate_id == "Gate-A"
        assert gate.sensor_count == 200
        assert gate.capacity == 1000

    def test_gate_data_empty_gate_id_raises(self):
        with pytest.raises(ValidationError):
            GateData(gate_id="", sensor_count=200, capacity=1000)

    def test_gate_data_negative_sensor_count_raises(self):
        with pytest.raises(ValidationError):
            GateData(gate_id="G1", sensor_count=-1, capacity=100)

    def test_gate_data_negative_capacity_raises(self):
        with pytest.raises(ValidationError):
            GateData(gate_id="G1", sensor_count=50, capacity=0)

    def test_gate_data_sensor_count_exceeds_max_raises(self):
        with pytest.raises(ValidationError):
            GateData(gate_id="G1", sensor_count=200000, capacity=100)

    def test_gate_data_capacity_exceeds_max_raises(self):
        with pytest.raises(ValidationError):
            GateData(gate_id="G1", sensor_count=50, capacity=300000)

    def test_gate_data_max_valid_values(self):
        gate = GateData(gate_id="G" * 64, sensor_count=100000, capacity=200000)
        assert gate.gate_id == "G" * 64

    def test_gate_data_gate_id_too_long_raises(self):
        with pytest.raises(ValidationError):
            GateData(gate_id="G" * 65, sensor_count=50, capacity=100)

    def test_gate_data_minimal_valid(self):
        gate = GateData(gate_id="A", sensor_count=0, capacity=1)
        assert gate.sensor_count == 0
        assert gate.capacity == 1


class TestCalculateRequest:
    def test_valid_calculate_request(self):
        gates = [GateData(gate_id="Gate-A", sensor_count=200, capacity=1000)]
        req = CalculateRequest(stadium_id="S1", gates=gates)
        assert req.stadium_id == "S1"
        assert len(req.gates) == 1

    def test_calculate_request_empty_gates_raises(self):
        with pytest.raises(ValidationError):
            CalculateRequest(stadium_id="S1", gates=[])

    def test_calculate_request_negative_sensor_count_raises(self):
        with pytest.raises(ValidationError):
            CalculateRequest(
                stadium_id="S1",
                gates=[GateData(gate_id="G1", sensor_count=-1, capacity=100)],
            )

    def test_calculate_request_missing_stadium_id_raises(self):
        with pytest.raises(ValidationError):
            CalculateRequest(gates=[GateData(gate_id="G1", sensor_count=10, capacity=100)])

    def test_calculate_request_stadium_id_too_long_raises(self):
        with pytest.raises(ValidationError):
            CalculateRequest(
                stadium_id="X" * 129,
                gates=[GateData(gate_id="G1", sensor_count=10, capacity=100)],
            )

    def test_calculate_request_multiple_gates(self):
        gates = [
            GateData(gate_id="Gate-A", sensor_count=200, capacity=1000),
            GateData(gate_id="Gate-B", sensor_count=400, capacity=1000),
            GateData(gate_id="Gate-C", sensor_count=50, capacity=500),
        ]
        req = CalculateRequest(stadium_id="S1", gates=gates)
        assert len(req.gates) == 3


class TestEntryRequest:
    def test_valid_entry_request(self):
        req = EntryRequest(
            device_id="dev-1",
            activity_type="crowd_report",
            description="Test description",
            severity="info",
        )
        assert req.device_id == "dev-1"
        assert req.activity_type == "crowd_report"

    def test_entry_request_invalid_activity_type_raises(self):
        with pytest.raises(ValidationError):
            EntryRequest(
                device_id="dev-1",
                activity_type="invalid_type",
                description="Test",
                severity="info",
            )

    def test_entry_request_invalid_severity_raises(self):
        with pytest.raises(ValidationError):
            EntryRequest(
                device_id="dev-1",
                activity_type="crowd_report",
                description="Test",
                severity="extreme",
            )

    def test_entry_request_empty_description_raises(self):
        with pytest.raises(ValidationError):
            EntryRequest(
                device_id="dev-1",
                activity_type="crowd_report",
                description="",
                severity="info",
            )

    def test_entry_request_all_valid_severities(self):
        for sev in ("info", "warning", "critical"):
            req = EntryRequest(
                device_id="dev-1",
                activity_type="other",
                description="T",
                severity=sev,
            )
            assert req.severity == sev

    def test_entry_request_all_valid_activity_types(self):
        valid_types = {
            "crowd_report",
            "incident_log",
            "shift_checkin",
            "facility_issue",
            "fan_assist",
            "other",
        }
        for atype in valid_types:
            req = EntryRequest(
                device_id="dev-1",
                activity_type=atype,
                description="T",
                severity="info",
            )
            assert req.activity_type == atype

    def test_entry_request_without_location_is_valid(self):
        req = EntryRequest(
            device_id="dev-1",
            activity_type="shift_checkin",
            description="Started shift",
            severity="info",
        )
        assert req.location is None

    def test_entry_request_with_location_is_valid(self):
        req = EntryRequest(
            device_id="dev-1",
            activity_type="crowd_report",
            description="Crowd growing",
            location="North Entrance",
            severity="info",
        )
        assert req.location == "North Entrance"


class TestInsightsRequest:
    def test_valid_insights_request(self):
        req = InsightsRequest(
            stadium_id="S1",
            context_type="crowd_routing",
            input_text="Test input",
            target_language="en",
        )
        assert req.context_type == "crowd_routing"
        assert req.target_language == "en"

    def test_insights_request_invalid_context_type_raises(self):
        with pytest.raises(ValidationError):
            InsightsRequest(
                stadium_id="S1",
                context_type="invalid_context",
                input_text="Test",
                target_language="en",
            )

    def test_insights_request_target_language_too_short_raises(self):
        with pytest.raises(ValidationError):
            InsightsRequest(
                stadium_id="S1",
                context_type="crowd_routing",
                input_text="Test",
                target_language="x",
            )

    def test_insights_request_target_language_too_long_raises(self):
        with pytest.raises(ValidationError):
            InsightsRequest(
                stadium_id="S1",
                context_type="crowd_routing",
                input_text="Test",
                target_language="x" * 11,
            )

    def test_insights_request_all_valid_context_types(self):
        for ct in ("crowd_routing", "fan_translation", "facility_alert"):
            req = InsightsRequest(
                stadium_id="S1",
                context_type=ct,
                input_text="Test",
                target_language="en",
            )
            assert req.context_type == ct

    def test_insights_request_target_language_is_lowercased(self):
        req = InsightsRequest(
            stadium_id="S1",
            context_type="crowd_routing",
            input_text="Test",
            target_language="ES",
        )
        assert req.target_language == "es"

    def test_insights_request_with_gate_data(self):
        gates = [GateData(gate_id="Gate-A", sensor_count=200, capacity=1000)]
        req = InsightsRequest(
            stadium_id="S1",
            context_type="crowd_routing",
            input_text="Test",
            target_language="en",
            gate_data=gates,
        )
        assert req.gate_data is not None
        assert len(req.gate_data) == 1


class TestErrorResponse:
    def test_error_response_creation(self):
        err = ErrorResponse(detail="Something went wrong", error_code="TEST_ERROR")
        assert err.detail == "Something went wrong"
        assert err.error_code == "TEST_ERROR"
        assert err.timestamp is not None

    def test_error_response_timestamp_is_iso_format(self):
        err = ErrorResponse(detail="Error occurred", error_code="E001")
        assert "T" in err.timestamp

    def test_error_response_empty_detail_allowed(self):
        err = ErrorResponse(detail="", error_code="E001")
        assert err.detail == ""


class TestEdgeCases:
    def test_very_long_description_within_limits(self):
        desc = "A" * 8192
        req = EntryRequest(
            device_id="dev-1",
            activity_type="other",
            description=desc,
            severity="info",
        )
        assert len(req.description) == 8192

    def test_very_long_description_exceeds_limit_raises(self):
        desc = "A" * 8193
        with pytest.raises(ValidationError):
            EntryRequest(
                device_id="dev-1",
                activity_type="other",
                description=desc,
                severity="info",
            )

    def test_stadium_id_at_max_length(self):
        req = InsightsRequest(
            stadium_id="X" * 128,
            context_type="crowd_routing",
            input_text="Test",
            target_language="en",
        )
        assert len(req.stadium_id) == 128

    def test_input_text_at_max_length(self):
        text = "A" * 8192
        req = InsightsRequest(
            stadium_id="S1",
            context_type="crowd_routing",
            input_text=text,
            target_language="en",
        )
        assert len(req.input_text) == 8192

    def test_device_id_at_max_length(self):
        did = "D" * 128
        req = EntryRequest(
            device_id=did,
            activity_type="other",
            description="Test",
            severity="info",
        )
        assert len(req.device_id) == 128
