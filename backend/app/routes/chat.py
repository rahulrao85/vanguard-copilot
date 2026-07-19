"""
Conversational AI chat route with SSE streaming responses.
"""

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["chat"])

_CHAT_SYSTEM_PROMPT = """You are Vanguard Co-Pilot, a smart stadium assistant
for FIFA World Cup 2026 volunteers.
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


async def _stream_chat(message: str, history: list[ChatMessage]) -> AsyncIterator[str]:
    """Generator that streams OpenRouter response chunks as SSE."""
    import os

    from app.config import settings

    api_key = os.environ.get("OPENROUTER_API_KEY") or settings.gemini_api_key
    model = "deepseek/deepseek-v4-flash"

    if not api_key:
        # Fallback mock stream
        mock = (
            f"I'm Vanguard Co-Pilot! Regarding your query about '{message[:60]}': "
            "please check the crowd heatmap for real-time gate status. "
            "For urgent issues, contact the nearest volunteer supervisor."
        )
        for word in mock.split():
            yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
            await asyncio.sleep(0.04)
        yield "data: [DONE]\n\n"
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vanguard-copilot.run.place",
        "X-Title": "Vanguard Co-Pilot",
    }

    # Build conversation history for OpenRouter
    messages = [{"role": "system", "content": _CHAT_SYSTEM_PROMPT}]
    for msg in history[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 256,
        "stream": True,
    }

    fallback = (
        "Stadium systems are processing your request. "
        "Please check the live telemetry dashboard for current gate status."
    )

    try:
        import httpx

        async with (
            httpx.AsyncClient() as client,
            client.stream(
                "POST",
                url,
                headers=headers,
                json=payload,
                timeout=30.0,
            ) as response,
        ):
            if response.status_code != 200:
                for word in fallback.split():
                    yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
                    await asyncio.sleep(0.04)
                yield "data: [DONE]\n\n"
                return

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        parsed = json.loads(data_str)
                        delta = parsed["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield f"data: {json.dumps({'chunk': delta})}\n\n"
                    except Exception:
                        pass

    except Exception:
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
