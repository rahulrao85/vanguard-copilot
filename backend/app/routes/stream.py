"""
SSE streaming routes for live telemetry and judge demo mode.
"""

import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse

from app.services.simulator import demo_mode, live_simulator

router = APIRouter(prefix="/api", tags=["stream"])


async def _telemetry_generator():
    """Yields SSE-formatted telemetry every 3 seconds."""
    while True:
        state = live_simulator.get_state()
        yield f"data: {json.dumps(state)}\n\n"
        await asyncio.sleep(3)


@router.get("/stream")
async def telemetry_stream():
    """GET /api/stream — live telemetry SSE endpoint."""
    return StreamingResponse(
        _telemetry_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ─── Demo / Judge Mode ────────────────────────────────────────


@router.post("/demo/start")
async def demo_start() -> JSONResponse:
    """Reset demo to step 0 and return initial state."""
    state = demo_mode.reset()
    return JSONResponse(content=state)


@router.post("/demo/next")
async def demo_next() -> JSONResponse:
    """Advance one beat and return updated state."""
    state = demo_mode.next_beat()
    return JSONResponse(content=state)


@router.post("/demo/prev")
async def demo_prev() -> JSONResponse:
    """Go back one beat and return updated state."""
    state = demo_mode.prev_beat()
    return JSONResponse(content=state)


@router.post("/demo/reset")
async def demo_reset() -> JSONResponse:
    """Reset demo to step 0."""
    state = demo_mode.reset()
    return JSONResponse(content=state)


@router.get("/demo/status")
async def demo_status() -> JSONResponse:
    """Return current demo step number and total steps."""
    return JSONResponse(
        content={
            "step": demo_mode.step,
            "total_steps": demo_mode.total_steps,
            "state": demo_mode.current_state(),
        }
    )
