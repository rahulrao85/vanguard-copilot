"""Tests for the stadium telemetry simulator."""

from app.services.simulator import (
    CONCESSION_IDS,
    DEMO_SCRIPT,
    GATE_IDS,
    ZONE_IDS,
    DeterministicMode,
    StadiumSimulator,
)


class TestStadiumSimulator:
    def setup_method(self):
        self.sim = StadiumSimulator(seed=42)

    def test_get_state_returns_dict(self):
        state = self.sim.get_state()
        assert isinstance(state, dict)

    def test_get_state_has_required_keys(self):
        state = self.sim.get_state()
        assert "gates" in state
        assert "zones" in state
        assert "concessions" in state
        assert "timestamp" in state
        assert "phase" in state

    def test_gates_have_all_gate_ids(self):
        state = self.sim.get_state()
        for gid in GATE_IDS:
            assert gid in state["gates"]

    def test_zones_have_all_zone_ids(self):
        state = self.sim.get_state()
        for zid in ZONE_IDS:
            assert zid in state["zones"]

    def test_concessions_have_all_ids(self):
        state = self.sim.get_state()
        for cid in CONCESSION_IDS:
            assert cid in state["concessions"]

    def test_gate_occupancy_in_valid_range(self):
        state = self.sim.get_state()
        for pct in state["gates"].values():
            assert 0 <= pct <= 100

    def test_zone_density_in_valid_range(self):
        state = self.sim.get_state()
        for pct in state["zones"].values():
            assert 0 <= pct <= 100

    def test_phase_in_valid_range(self):
        state = self.sim.get_state()
        assert 0 <= state["phase"] <= 1

    def test_different_seeds_give_different_states(self):
        sim_a = StadiumSimulator(seed=1)
        sim_b = StadiumSimulator(seed=2)
        state_a = sim_a.get_state()
        state_b = sim_b.get_state()
        assert state_a["gates"] != state_b["gates"]


class TestDeterministicMode:
    def setup_method(self):
        self.demo = DeterministicMode()

    def test_initial_step_is_zero(self):
        self.demo.reset()
        assert self.demo.step == 0

    def test_total_steps_matches_script(self):
        assert self.demo.total_steps == len(DEMO_SCRIPT)

    def test_current_state_has_required_keys(self):
        state = self.demo.current_state()
        assert "gates" in state
        assert "event" in state
        assert "tick" in state
        assert "step" in state

    def test_next_beat_advances_step(self):
        self.demo.reset()
        self.demo.next_beat()
        assert self.demo.step == 1

    def test_prev_beat_does_not_go_below_zero(self):
        self.demo.reset()
        self.demo.prev_beat()
        assert self.demo.step == 0

    def test_next_beat_does_not_exceed_max(self):
        self.demo.reset()
        for _ in range(100):
            self.demo.next_beat()
        assert self.demo.step == self.demo.total_steps - 1

    def test_reset_returns_to_step_zero(self):
        self.demo.next_beat()
        self.demo.next_beat()
        state = self.demo.reset()
        assert self.demo.step == 0
        assert state["step"] == 0

    def test_event_labels_are_strings(self):
        state = self.demo.current_state()
        assert isinstance(state["event"], str)
        assert len(state["event"]) > 0

    def test_gate_occupancy_in_range(self):
        state = self.demo.current_state()
        for pct in state["gates"].values():
            assert 0 <= pct <= 100

    def test_prev_beat_returns_correct_step(self):
        self.demo.reset()
        self.demo.next_beat()
        self.demo.next_beat()
        state = self.demo.prev_beat()
        assert state["step"] == 1

    def test_demo_script_has_20_steps(self):
        assert len(DEMO_SCRIPT) == 20

    def test_all_script_entries_have_event_and_phase(self):
        for entry in DEMO_SCRIPT:
            assert "event" in entry
            assert "phase" in entry
            assert 0 <= entry["phase"] <= 1
