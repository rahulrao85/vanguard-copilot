"""
Conversational AI chat route with SSE streaming responses.
"""

import asyncio
import json
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.deps import get_gemini_service

router = APIRouter(prefix="/api", tags=["chat"])

_CHAT_SYSTEM_PROMPT = """You are Vanguard Co-Pilot, a smart stadium assistant for FIFA World Cup 2026 volunteers.
You help with:
- Crowd routing and gate congestion advice
- Fan queries and multilingual support
- Facility alerts and operational decisions
- Real-time stadium situational awareness

Keep responses concise (2-4 sentences), actionable, and suitable for a busy volunteer on the ground.
Always be helpful, calm, and professional."""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


async def _stream_chat(message: str, history: list[ChatMessage]):
    """Generator that streams Gemini response chunks as SSE."""
    service = get_gemini_service()
    client = service._client  # type: ignore[attr-defined]

    if not client:
        # Fallback mock stream
        mock = f"I'm Vanguard Co-Pilot! Regarding your query about '{message[:60]}': please check the crowd heatmap for real-time gate status. For urgent issues, contact the nearest volunteer supervisor."
        for word in mock.split():
            yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
            await asyncio.sleep(0.04)
        yield "data: [DONE]\n\n"
        return

    # Build conversation history for Gemini
    contents: list[dict[str, Any]] = []
    for msg in history[-10:]:  # last 10 messages for context
        contents.append({"role": msg.role, "parts": [{"text": msg.content}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    try:
        import google.generativeai as genai_compat  # type: ignore
        from google.genai import types

        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-1.5-flash",
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=_CHAT_SYSTEM_PROMPT,
                temperature=0.5,
                max_output_tokens=256,
            ),
        )
        text = response.text or "I'm here to help. Please check the dashboard for live stadium data."

        # Simulate streaming by chunking the response
        words = text.split()
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            await asyncio.sleep(0.03)

    except Exception:
        fallback = "Stadium systems are processing your request. Please check the live telemetry dashboard for current gate status."
        for word in fallback.split():
            yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
            await asyncio.sleep(0.04)

    yield "data: [DONE]\n\n"


@router.post("/chat")
async def chat_endpoint(request: ChatRequest) -> StreamingResponse:
    """POST /api/chat — streaming conversational AI assistant."""
    return StreamingResponse(
        _stream_chat(request.message, request.history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
