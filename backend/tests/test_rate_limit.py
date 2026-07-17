"""
Tests for rate limiter registration and configuration.
"""

from slowapi import Limiter

from app.rate_limit import limiter


class TestRateLimiterRegistration:
    def test_limiter_is_registered_and_not_none(self):
        assert limiter is not None

    def test_limiter_is_limiter_instance(self):
        assert isinstance(limiter, Limiter)

    def test_limiter_has_default_limits_attribute(self):
        assert hasattr(limiter, "_default_limits")

    def test_limiter_default_limits_is_not_empty(self):
        assert limiter._default_limits is not None
        assert len(limiter._default_limits) >= 1

    def test_limiter_default_limits_contains_rate_limit(self):
        assert len(limiter._default_limits) >= 1

    def test_limiter_has_key_func(self):
        assert hasattr(limiter, "_key_func") or hasattr(limiter, "key_func")

    def test_app_state_has_limiter(self):
        from app.main import app
        assert hasattr(app.state, "limiter")
        assert app.state.limiter is limiter
