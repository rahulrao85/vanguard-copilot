"""
Tests for application configuration and settings.
"""


from app.config import Settings


class TestSettingsDefaults:
    def test_default_app_name(self):
        settings = Settings()
        assert settings.app_name == "Vanguard Co-Pilot"

    def test_default_project_id(self):
        settings = Settings()
        assert settings.project_id == "vanguard-copilot"

    def test_default_debug_is_false(self):
        settings = Settings()
        assert settings.debug is False

    def test_default_log_level(self):
        settings = Settings()
        assert settings.log_level == "INFO"

    def test_default_gemini_api_key_is_empty(self):
        settings = Settings()
        assert settings.gemini_api_key == ""

    def test_default_gemini_model(self):
        settings = Settings()
        assert settings.gemini_model == "gemini-1.5-flash"

    def test_default_rate_limit_requests(self):
        settings = Settings()
        assert settings.rate_limit_requests == 30

    def test_default_rate_limit_window(self):
        settings = Settings()
        assert settings.rate_limit_window == "1 minute"

    def test_max_payload_bytes_is_65536(self):
        settings = Settings()
        assert settings.max_payload_bytes == 65536

    def test_default_allowed_origins(self):
        settings = Settings()
        assert "http://localhost:5173" in settings.allowed_origins
        assert "http://localhost:3000" in settings.allowed_origins

    def test_extra_fields_are_ignored(self):
        settings = Settings()
        assert not hasattr(settings, "nonexistent_field")


class TestSettingsEnvironmentOverride:
    def test_env_overrides_app_name(self, monkeypatch):
        monkeypatch.setenv("app_name", "Custom App Name")
        settings = Settings()
        assert settings.app_name == "Custom App Name"

    def test_env_overrides_debug(self, monkeypatch):
        monkeypatch.setenv("debug", "true")
        settings = Settings()
        assert settings.debug is True

    def test_env_overrides_log_level(self, monkeypatch):
        monkeypatch.setenv("log_level", "DEBUG")
        settings = Settings()
        assert settings.log_level == "DEBUG"

    def test_env_overrides_rate_limit_requests(self, monkeypatch):
        monkeypatch.setenv("rate_limit_requests", "60")
        settings = Settings()
        assert settings.rate_limit_requests == 60

    def test_env_overrides_max_payload_bytes(self, monkeypatch):
        monkeypatch.setenv("max_payload_bytes", "131072")
        settings = Settings()
        assert settings.max_payload_bytes == 131072

    def test_env_overrides_gemini_model(self, monkeypatch):
        monkeypatch.setenv("gemini_model", "gemini-2.0-flash")
        settings = Settings()
        assert settings.gemini_model == "gemini-2.0-flash"

    def test_multiple_env_overrides(self, monkeypatch):
        monkeypatch.setenv("app_name", "Overridden App")
        monkeypatch.setenv("debug", "true")
        monkeypatch.setenv("log_level", "WARNING")
        settings = Settings()
        assert settings.app_name == "Overridden App"
        assert settings.debug is True
        assert settings.log_level == "WARNING"
