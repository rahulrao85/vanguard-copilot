"""
Insights route for Phase 3 (Reduce): Invokes Gemini AI to analyze gate
congestions or fan questions, generating multilingual megaphone scripts
and actionable reasoning recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, Request

from app.models.schemas import InsightsRequest, InsightsResponse, ErrorResponse
from app.services.gemini import GeminiService
from app.deps import get_gemini_service
from app.rate_limit import limiter

router = APIRouter(tags=["insights"])


@router.post(
    "/api/insights",
    response_model=InsightsResponse,
    responses={200: {"description": "Success"}, 400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    summary="Generate AI-powered insights and recommendations",
)
@limiter.limit("30/minute")
async def generate_insights(
    request: Request,
    payload: InsightsRequest,
    gemini: GeminiService = Depends(get_gemini_service),
) -> InsightsResponse:
    """Analyze stadium context and generate AI-powered recommendations.

    Uses Google Gemini to produce multilingual megaphone scripts for crowd
    routing, fan query translations, or facility alerts. Phase 3 of the
    Understand → Track → Reduce lifecycle.
    """
    try:
        result = await gemini.generate_insights(
            stadium_id=payload.stadium_id,
            context_type=payload.context_type,
            input_text=payload.input_text,
            target_language=payload.target_language,
            gate_data=payload.gate_data,
        )

        recommendations = result.get("recommendations", [])
        if isinstance(recommendations, str):
            recommendations = [recommendations]

        return InsightsResponse(
            stadium_id=payload.stadium_id,
            context_type=payload.context_type,
            megaphone_script=str(result.get("megaphone_script", "")),
            reasoning=str(result.get("reasoning", "No reasoning provided.")),
            target_language=payload.target_language,
            recommendations=[str(r) for r in recommendations],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight generation failed: {str(e)}")
