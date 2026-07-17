"""
Pydantic models for the Vanguard Co-Pilot API.
Defines request/response schemas with strict validation.
"""

from datetime import UTC, datetime

from pydantic import BaseModel, Field, field_validator


class GateData(BaseModel):
    """Individual gate sensor data for crowd calculation."""

    gate_id: str = Field(..., min_length=1, max_length=64, description="Unique gate identifier")
    sensor_count: int = Field(..., ge=0, le=100000, description="Raw crowd count from sensor")
    capacity: int = Field(..., ge=1, le=200000, description="Maximum gate capacity")


class CalculateRequest(BaseModel):
    """Request payload for the /api/calculate endpoint."""

    stadium_id: str = Field(..., min_length=1, max_length=128, description="Stadium identifier")
    gates: list[GateData] = Field(..., min_length=1, max_length=200, description="List of gate data points")

    @field_validator("gates")
    @classmethod
    def validate_gates_has_items(cls, v: list[GateData]) -> list[GateData]:
        """Ensure at least one gate is provided."""
        if len(v) == 0:
            raise ValueError("At least one gate must be provided")
        return v


class GateStatus(BaseModel):
    """Computed status for a single gate."""

    gate_id: str
    density_percent: float = Field(..., ge=0.0, le=100.0)
    status: str = Field(..., description="One of: clear, moderate, busy, critical")
    recommendation: str = Field(..., description="Action recommendation for volunteers")


class CalculateResponse(BaseModel):
    """Response from the /api/calculate endpoint."""

    stadium_id: str
    overall_density_percent: float
    total_people: int
    total_capacity: int
    gates: list[GateStatus]
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class EntryRequest(BaseModel):
    """Request payload for the /api/entries endpoint."""

    device_id: str = Field(..., min_length=1, max_length=128, description="Anonymous device identifier")
    activity_type: str = Field(..., min_length=1, max_length=64, description="Type of activity logged")
    description: str = Field(..., min_length=1, max_length=8192, description="Activity or incident description")
    location: str | None = Field(default=None, max_length=256, description="Location within the stadium")
    severity: str = Field(default="info", pattern=r"^(info|warning|critical)$", description="Severity level")

    @field_validator("activity_type")
    @classmethod
    def validate_activity_type(cls, v: str) -> str:
        """Ensure activity_type is a recognized category."""
        valid_types = {"crowd_report", "incident_log", "shift_checkin", "facility_issue", "fan_assist", "other"}
        if v not in valid_types:
            raise ValueError(f"activity_type must be one of: {', '.join(sorted(valid_types))}")
        return v


class EntryResponse(BaseModel):
    """Response from the /api/entries endpoint."""

    entry_id: str
    device_id: str
    activity_type: str
    description: str
    location: str | None
    severity: str
    created_at: str
    status: str = "logged"


class EntriesListResponse(BaseModel):
    """List of entries for a given device_id."""

    device_id: str
    entries: list[EntryResponse]
    total: int


class InsightsRequest(BaseModel):
    """Request payload for the /api/insights endpoint."""

    stadium_id: str = Field(..., min_length=1, max_length=128)
    context_type: str = Field(..., description="Insight type: crowd_routing, fan_translation, facility_alert")
    input_text: str = Field(..., min_length=1, max_length=8192, description="Raw context or fan query")
    target_language: str = Field(default="en", max_length=10, description="Target language code for translations")
    gate_data: list[GateData] | None = Field(default=None, description="Optional gate data for routing insights")

    @field_validator("context_type")
    @classmethod
    def validate_context_type(cls, v: str) -> str:
        """Ensure context_type is a recognized category."""
        valid = {"crowd_routing", "fan_translation", "facility_alert"}
        if v not in valid:
            raise ValueError(f"context_type must be one of: {', '.join(sorted(valid))}")
        return v

    @field_validator("target_language")
    @classmethod
    def validate_target_language(cls, v: str) -> str:
        """Ensure target_language is a reasonable language code."""
        if len(v) < 2 or len(v) > 10:
            raise ValueError("target_language must be between 2 and 10 characters")
        return v.lower()


class InsightsResponse(BaseModel):
    """Response from the /api/insights endpoint."""

    stadium_id: str
    context_type: str
    megaphone_script: str = Field(..., description="Multilingual script for volunteers to announce")
    reasoning: str = Field(..., description="AI reasoning behind the recommendation")
    target_language: str
    recommendations: list[str] = Field(default_factory=list, description="Actionable recommendations")
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class ErrorResponse(BaseModel):
    """Standardized error response."""

    detail: str
    error_code: str
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
