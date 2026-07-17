"""
Entries routes for Phase 2 (Track): Saves and retrieves volunteer shift activity
logs and incident reports keyed by anonymous device_id.
"""

from fastapi import APIRouter, Depends, HTTPException, Request

from app.models.schemas import EntryRequest, EntryResponse, EntriesListResponse, ErrorResponse
from app.repository.base import AbstractRepository
from app.deps import get_repository
from app.rate_limit import limiter

router = APIRouter(tags=["entries"])


@router.post(
    "/api/entries",
    response_model=EntryResponse,
    status_code=201,
    responses={
        201: {"description": "Entry created"},
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
    summary="Save a volunteer activity log entry",
)
@limiter.limit("30/minute")
async def create_entry(
    request: Request,
    payload: EntryRequest,
    repo: AbstractRepository = Depends(get_repository),
) -> EntryResponse:
    """Create a new volunteer shift activity log or incident report.

    Stores the entry against the anonymous device_id for later retrieval.
    Phase 2 of the Understand → Track → Reduce lifecycle.
    """
    try:
        entry = await repo.create_entry(payload)
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save entry: {str(e)}")


@router.get(
    "/api/entries/{device_id}",
    response_model=EntriesListResponse,
    responses={200: {"description": "Success"}, 429: {"model": ErrorResponse}},
    summary="Retrieve all entries for a device",
)
@limiter.limit("30/minute")
async def get_entries(
    request: Request,
    device_id: str,
    repo: AbstractRepository = Depends(get_repository),
) -> EntriesListResponse:
    """Retrieve all activity logs and incident reports for a given device_id.

    The device_id is an anonymous identifier stored in the volunteer's browser
    localStorage, providing privacy-preserving activity tracking.
    """
    if not device_id or len(device_id) > 128:
        raise HTTPException(status_code=400, detail="Invalid device_id")

    try:
        entries = await repo.get_entries_by_device(device_id)
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve entries: {str(e)}")
