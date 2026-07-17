"""
Calculate route for Phase 1 (Understand): Computes crowd density percentages
and gate status from incoming sensor counts or mock gate data.
"""

from fastapi import APIRouter, Request

from app.models.schemas import CalculateRequest, CalculateResponse, ErrorResponse, GateStatus
from app.rate_limit import limiter

router = APIRouter(tags=["calculate"])


def _compute_density(sensor_count: int, capacity: int) -> float:
    """Compute crowd density as a percentage of gate capacity."""
    if capacity <= 0:
        return 100.0
    density = (sensor_count / capacity) * 100.0
    return round(min(density, 100.0), 2)


def _determine_status(density: float) -> str:
    """Map a density percentage to a human-readable status label."""
    if density < 30.0:
        return "clear"
    if density < 60.0:
        return "moderate"
    if density < 85.0:
        return "busy"
    return "critical"


def _get_recommendation(gate_id: str, status: str) -> str:
    """Generate an actionable recommendation based on gate status."""
    recommendations = {
        "clear": f"Gate {gate_id} is flowing smoothly. Maintain current staffing levels.",
        "moderate": f"Gate {gate_id} traffic is moderate. Monitor closely for buildup.",
        "busy": f"Gate {gate_id} is getting crowded. Consider opening additional lanes.",
        "critical": (
            f"Gate {gate_id} is critically congested! "
            "Deploy crowd control and redirect to alternate gates immediately."
        ),
    }
    return recommendations.get(status, "Status unknown. Monitor the situation.")


@router.post(
    "/api/calculate",
    response_model=CalculateResponse,
    responses={
        200: {"description": "Success"},
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
    summary="Calculate crowd density and gate status",
)
@limiter.limit("30/minute")
async def calculate(request: Request, payload: CalculateRequest) -> CalculateResponse:
    """Process gate sensor data and return computed crowd density and gate status.

    Phase 1 of the Understand → Track → Reduce lifecycle.
    Takes raw sensor counts and gate capacities to compute density percentages,
    status classifications, and actionable recommendations for volunteers.
    """
    gate_statuses: list[GateStatus] = []
    total_people = 0
    total_capacity = 0

    for gate in payload.gates:
        density = _compute_density(gate.sensor_count, gate.capacity)
        status = _determine_status(density)
        recommendation = _get_recommendation(gate.gate_id, status)

        gate_statuses.append(
            GateStatus(
                gate_id=gate.gate_id,
                density_percent=density,
                status=status,
                recommendation=recommendation,
            )
        )
        total_people += gate.sensor_count
        total_capacity += gate.capacity

    overall_density = _compute_density(total_people, total_capacity)

    return CalculateResponse(
        stadium_id=payload.stadium_id,
        overall_density_percent=overall_density,
        total_people=total_people,
        total_capacity=total_capacity,
        gates=gate_statuses,
    )
