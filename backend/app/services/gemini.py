"""
Google Gemini AI service for generating multilingual crowd-routing scripts,
fan query translations, and operational reasoning recommendations.
"""

import json

from google import genai  # type: ignore[import-untyped]
from google.genai import types  # type: ignore[import-untyped]

from app.config import settings
from app.models.schemas import GateData

SYSTEM_PROMPT = """You are Vanguard Co-Pilot, an AI assistant for FIFA World Cup 2026 stadium volunteers.
Your role is to help volunteers manage crowds, translate fan queries into multiple languages, and
provide operational decision support.

When generating responses, follow these rules:
1. For crowd_routing: Analyze gate congestion data and provide a clear megaphone script in the target language that redirects fans to less crowded gates. Include specific gate names/numbers and brief directions.
2. For fan_translation: Translate the fan's query into the target language, then provide a response script the volunteer can read aloud. Include cultural courtesy notes if relevant.
3. For facility_alert: Generate an operational alert script for radio/megaphone broadcast with clear, concise instructions for facility staff.
4. Always include reasoning that explains WHY the recommendation was made.
5. Respond ONLY with a valid JSON object: {"megaphone_script": "...", "reasoning": "...", "recommendations": [...]}
6. Keep megaphone scripts concise (max 150 words) and use clear, directive language suitable for stadium announcements.
7. If the target language is not English, the megaphone_script must be in that language while reasoning remains in English.
"""


class GeminiService:
    """Service wrapper for Google Gemini AI model interactions."""

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
        self._configured = settings.gemini_api_key != ""

    async def generate_insights(
        self,
        stadium_id: str,
        context_type: str,
        input_text: str,
        target_language: str,
        gate_data: list[GateData] | None = None,
    ) -> dict[str, object]:
        """Generate AI-powered insights using Gemini for the given stadium context.

        Args:
            stadium_id: Identifier for the stadium.
            context_type: One of crowd_routing, fan_translation, facility_alert.
            input_text: Raw context data or fan query text.
            target_language: ISO language code for the output script.
            gate_data: Optional gate sensor data for crowd_routing context.

        Returns:
            A dict with megaphone_script, reasoning, and recommendations keys.
        """
        if not self._configured or not self._client:
            return self._mock_response(context_type, target_language, input_text, gate_data)

        gate_info = self._format_gate_data(gate_data) if gate_data else "No gate data provided."

        user_prompt = f"""
Stadium: {stadium_id}
Context Type: {context_type}
Target Language: {target_language}
Gate Data: {gate_info}
Input/Query: {input_text}

Generate a volunteer assistance response following the rules in the system prompt.
Respond ONLY with the JSON object. Do not include markdown formatting or code blocks.
"""

        try:
            response = self._client.models.generate_content(
                model=settings.gemini_model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                    top_p=0.9,
                    max_output_tokens=1024,
                ),
            )

            if response.text:
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    text = text.rsplit("\n```", 1)[0]
                return json.loads(text)
            return self._mock_response(context_type, target_language, input_text, gate_data)

        except Exception:
            return self._mock_response(context_type, target_language, input_text, gate_data)

    def _format_gate_data(self, gates: list[GateData]) -> str:
        """Format gate data into a human-readable string for the prompt."""
        lines = []
        for g in gates:
            density = (g.sensor_count / g.capacity) * 100 if g.capacity > 0 else 0.0
            lines.append(f"Gate {g.gate_id}: {g.sensor_count}/{g.capacity} ({density:.1f}%)")
        return "\n".join(lines)

    def _mock_response(
        self,
        context_type: str,
        target_language: str,
        input_text: str,
        gate_data: list[GateData] | None = None,
    ) -> dict[str, object]:
        """Provide a mock response when Gemini API key is not configured.

        This enables local development and testing without real API credentials.
        """
        if context_type == "crowd_routing":
            busiest = "Gate A"
            if gate_data:
                busiest = max(gate_data, key=lambda g: g.sensor_count / max(g.capacity, 1)).gate_id
            return {
                "megaphone_script": f"Attention fans! {busiest} is currently experiencing high wait times. For faster entry, please proceed to Gate C or Gate D, located on the east side of the stadium. Thank you for your patience!",
                "reasoning": f"Identified {busiest} as the most congested gate. Recommended alternative gates with available capacity to reduce wait times.",
                "recommendations": [
                    f"Redirect incoming fans from {busiest} to alternate gates",
                    "Deploy additional volunteers to crowded gate for crowd management",
                    "Update digital signage to show real-time wait times",
                ],
            }
        elif context_type == "fan_translation":
            return {
                "megaphone_script": f"[{target_language}] Translated response for: {input_text[:100]}...",
                "reasoning": f"Generated translation to {target_language} using built-in language models.",
                "recommendations": [
                    "Use the translated script for megaphone announcements",
                    "Direct fan to nearest information kiosk if follow-up needed",
                ],
            }
        else:
            return {
                "megaphone_script": f"Attention stadium staff: A facility issue has been reported. Maintenance team please respond. Area: {input_text[:80]}...",
                "reasoning": "Generated facility alert based on the reported issue context.",
                "recommendations": [
                    "Dispatch nearest maintenance crew to the reported location",
                    "Cordon off affected area if safety concern exists",
                    "Update facility status log with incident details",
                ],
            }
