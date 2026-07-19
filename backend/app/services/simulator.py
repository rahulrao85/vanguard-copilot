"""
Stadium telemetry simulator with deterministic replay support.
Generates realistic match-day crowd data for live SSE streaming.
"""

import math
import random
import time
from dataclasses import dataclass, field
from typing import Any

GATE_IDS = [f"G{i}" for i in range(1, 17)]  # 16 gates
ZONE_IDS = [f"Z{i}" for i in range(1, 9)]  # 8 zones
CONCESSION_IDS = [f"C{i}" for i in range(1, 5)]  # 4 concession points

# Pre-recorded 20-step match-day script for demo/judge mode
DEMO_SCRIPT: list[dict[str, Any]] = [
    {"tick": 0, "event": "Gates Open", "phase": 0.05},
    {"tick": 1, "event": "Early Arrivals", "phase": 0.15},
    {"tick": 2, "event": "Filling Up", "phase": 0.25},
    {"tick": 3, "event": "Busy Entry", "phase": 0.40},
    {"tick": 4, "event": "Rush Hour", "phase": 0.60},
    {"tick": 5, "event": "Kickoff", "phase": 0.85},
    {"tick": 6, "event": "First 15 min", "phase": 0.90},
    {"tick": 7, "event": "Goal Scored!", "phase": 0.92},
    {"tick": 8, "event": "Play Continues", "phase": 0.88},
    {"tick": 9, "event": "Half Time", "phase": 0.70},
    {"tick": 10, "event": "Concession Rush", "phase": 0.55},
    {"tick": 11, "event": "2nd Half Starts", "phase": 0.82},
    {"tick": 12, "event": "Tension Rising", "phase": 0.89},
    {"tick": 13, "event": "Goal Scored!", "phase": 0.93},
    {"tick": 14, "event": "Final Push", "phase": 0.91},
    {"tick": 15, "event": "Full Time", "phase": 0.95},
    {"tick": 16, "event": "Egress Begins", "phase": 0.80},
    {"tick": 17, "event": "Mass Exit", "phase": 0.65},
    {"tick": 18, "event": "Winding Down", "phase": 0.40},
    {"tick": 19, "event": "Stadium Clear", "phase": 0.10},
]


@dataclass
class StadiumSimulator:
    """Generates live, seeded match-day telemetry every tick."""

    seed: int = 2026
    _rng: random.Random = field(init=False)
    _start_time: float = field(init=False)

    def __post_init__(self) -> None:
        self._rng = random.Random(self.seed)
        self._start_time = time.time()

    def _match_phase(self) -> float:
        """
        Returns a 0-1 crowd intensity factor based on elapsed time.
        Simulates: ramp-up → match → halftime → 2nd half → egress.
        """
        elapsed = (time.time() - self._start_time) / 3600  # hours
        # 2-hour match-day curve
        if elapsed < 0.5:
            return 0.3 + elapsed * 1.1  # ramp-up
        elif elapsed < 1.0:
            return 0.85 + math.sin(elapsed * math.pi) * 0.1  # match
        elif elapsed < 1.25:
            return 0.75 - (elapsed - 1.0) * 0.4  # halftime
        elif elapsed < 2.0:
            return 0.65 + (elapsed - 1.25) * 0.3  # 2nd half
        else:
            return max(0.1, 1.0 - (elapsed - 2.0) * 0.6)  # egress

    def get_state(self) -> dict[str, Any]:
        """Generate a fresh telemetry snapshot."""
        phase = self._match_phase()
        rng = self._rng

        gates = {gid: round(min(99, max(5, phase * 100 + rng.gauss(0, 8))), 1) for gid in GATE_IDS}
        zones = {zid: round(min(99, max(5, phase * 90 + rng.gauss(0, 10))), 1) for zid in ZONE_IDS}
        concessions = {
            cid: round(max(1, phase * 12 + rng.gauss(0, 2)), 1) for cid in CONCESSION_IDS
        }

        return {
            "timestamp": time.time(),
            "phase": round(phase, 3),
            "gates": gates,
            "zones": zones,
            "concessions": concessions,
        }


@dataclass
class DeterministicMode:
    """Pre-recorded 20-step match-day demo for judge replay."""

    _step: int = field(default=0, init=False)
    _rng: random.Random = field(init=False)

    def __post_init__(self) -> None:
        self._rng = random.Random(2026)

    def _state_for_phase(self, phase: float, event: str, tick: int) -> dict[str, Any]:
        rng = random.Random(2026 + tick)
        gates = {gid: round(min(99, max(5, phase * 100 + rng.gauss(0, 6))), 1) for gid in GATE_IDS}
        zones = {zid: round(min(99, max(5, phase * 90 + rng.gauss(0, 8))), 1) for zid in ZONE_IDS}
        concessions = {
            cid: round(max(1, phase * 12 + rng.gauss(0, 1.5)), 1) for cid in CONCESSION_IDS
        }
        return {
            "timestamp": time.time(),
            "tick": tick,
            "step": self._step,
            "total_steps": len(DEMO_SCRIPT),
            "event": event,
            "phase": round(phase, 3),
            "gates": gates,
            "zones": zones,
            "concessions": concessions,
        }

    def current_state(self) -> dict[str, Any]:
        entry = DEMO_SCRIPT[self._step]
        return self._state_for_phase(entry["phase"], entry["event"], entry["tick"])

    def next_beat(self) -> dict[str, Any]:
        self._step = min(self._step + 1, len(DEMO_SCRIPT) - 1)
        return self.current_state()

    def prev_beat(self) -> dict[str, Any]:
        self._step = max(self._step - 1, 0)
        return self.current_state()

    def reset(self) -> dict[str, Any]:
        self._step = 0
        return self.current_state()

    @property
    def step(self) -> int:
        return self._step

    @property
    def total_steps(self) -> int:
        return len(DEMO_SCRIPT)


# Global singletons used by the routes
live_simulator = StadiumSimulator()
demo_mode = DeterministicMode()
