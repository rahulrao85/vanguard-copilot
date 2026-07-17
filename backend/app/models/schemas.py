from datetime import UTC, datetime

from pydantic import BaseModel, Field, field_validator


class GateData(BaseModel):
    gate_id: str = Field(..., min_length=1, max_length=64)
    sensor_count: int = Field(..., ge=0, le=100000)
    capacity: int = Field(..., ge=1, le=200000)

    model_config = {"extra": "forbid"}


class CalculateRequest(BaseModel):
    stadium_id: str = Field(..., min_length=1, max_length=128)
    gates: list[GateData] = Field(..., min_length=1, max_length=200)

    model_config = {"extra": "forbid"}

    @field_validator("gates")
    @classmethod
    def validate_gates_has_items(cls, v: list[GateData]) -> list[GateData]:
        if len(v) == 0:
            raise ValueError("At least one gate must be provided")
        return v


class GateStatus(BaseModel):
    gate_id: str
    density_percent: float = Field(..., ge=0.0, le=100.0)
    status: str
    recommendation: str

    model_config = {"extra": "forbid"}


class CalculateResponse(BaseModel):
    stadium_id: str
    overall_density_percent: float
    total_people: int
    total_capacity: int
    gates: list[GateStatus]
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())

    model_config = {"extra": "forbid"}


class EntryRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=128)
    activity_type: str = Field(..., min_length=1, max_length=64)
    description: str = Field(..., min_length=1, max_length=8192)
    location: str | None = Field(default=None, max_length=256)
    severity: str = Field(default="info", pattern=r"^(info|warning|critical)$")

    model_config = {"extra": "forbid"}

    @field_validator("activity_type")
    @classmethod
    def validate_activity_type(cls, v: str) -> str:
        valid_types = {"crowd_report", "incident_log", "shift_checkin", "facility_issue", "fan_assist", "other"}
        if v not in valid_types:
            raise ValueError(f"activity_type must be one of: {', '.join(sorted(valid_types))}")
        return v


class EntryResponse(BaseModel):
    entry_id: str
    device_id: str
    activity_type: str
    description: str
    location: str | None
    severity: str
    created_at: str
    status: str = "logged"

    model_config = {"extra": "forbid"}


class EntriesListResponse(BaseModel):
    device_id: str
    entries: list[EntryResponse]
    total: int

    model_config = {"extra": "forbid"}


class InsightsRequest(BaseModel):
    stadium_id: str = Field(..., min_length=1, max_length=128)
    context_type: str
    input_text: str = Field(..., min_length=1, max_length=8192)
    target_language: str = Field(default="en", max_length=10)
    gate_data: list[GateData] | None = Field(default=None)

    model_config = {"extra": "forbid"}

    @field_validator("context_type")
    @classmethod
    def validate_context_type(cls, v: str) -> str:
        valid = {"crowd_routing", "fan_translation", "facility_alert"}
        if v not in valid:
            raise ValueError(f"context_type must be one of: {', '.join(sorted(valid))}")
        return v

    @field_validator("target_language")
    @classmethod
    def validate_target_language(cls, v: str) -> str:
        if len(v) < 2 or len(v) > 10:
            raise ValueError("target_language must be between 2 and 10 characters")
        return v.lower()


class InsightsResponse(BaseModel):
    stadium_id: str
    context_type: str
    megaphone_script: str
    reasoning: str
    target_language: str
    recommendations: list[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())

    model_config = {"extra": "forbid"}


class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())

    model_config = {"extra": "forbid"}
