"""
Unit tests for InMemoryRepository (no HTTP client needed).
"""


from app.models.schemas import EntryRequest
from app.repository.memory import InMemoryRepository


class TestCreateEntry:
    async def test_create_entry_returns_entry_response(self):
        repo = InMemoryRepository()
        payload = EntryRequest(
            device_id="dev-1",
            activity_type="crowd_report",
            description="Gate A crowd level increasing",
            severity="warning",
        )
        result = await repo.create_entry(payload)
        assert result.device_id == "dev-1"
        assert result.activity_type == "crowd_report"
        assert result.status == "logged"
        assert result.entry_id is not None
        assert result.created_at is not None

    async def test_create_entry_includes_location_when_provided(self):
        repo = InMemoryRepository()
        payload = EntryRequest(
            device_id="dev-2",
            activity_type="incident_log",
            description="Spilled drink at Section 5",
            location="Section 5",
            severity="info",
        )
        result = await repo.create_entry(payload)
        assert result.location == "Section 5"

    async def test_create_entry_generates_unique_entry_ids(self):
        repo = InMemoryRepository()
        payload = EntryRequest(
            device_id="dev-3",
            activity_type="shift_checkin",
            description="Started shift",
            severity="info",
        )
        entry1 = await repo.create_entry(payload)
        entry2 = await repo.create_entry(payload)
        assert entry1.entry_id != entry2.entry_id

    async def test_create_entry_preserves_severity(self):
        repo = InMemoryRepository()
        payload = EntryRequest(
            device_id="dev-4",
            activity_type="facility_issue",
            description="Broken light",
            severity="critical",
        )
        result = await repo.create_entry(payload)
        assert result.severity == "critical"


class TestGetEntriesByDevice:
    async def test_get_entries_by_device_returns_correct_entries(self):
        repo = InMemoryRepository()
        payload = EntryRequest(
            device_id="dev-get",
            activity_type="crowd_report",
            description="Test entry",
            severity="info",
        )
        await repo.create_entry(payload)
        result = await repo.get_entries_by_device("dev-get")
        assert result.device_id == "dev-get"
        assert result.total == 1
        assert len(result.entries) == 1
        assert result.entries[0].device_id == "dev-get"

    async def test_get_entries_by_device_returns_empty_for_unknown_device(self):
        repo = InMemoryRepository()
        result = await repo.get_entries_by_device("nonexistent")
        assert result.device_id == "nonexistent"
        assert result.total == 0
        assert result.entries == []

    async def test_multiple_entries_for_same_device(self):
        repo = InMemoryRepository()
        for i in range(5):
            payload = EntryRequest(
                device_id="dev-multi",
                activity_type="crowd_report",
                description=f"Entry {i}",
                severity="info",
            )
            await repo.create_entry(payload)
        result = await repo.get_entries_by_device("dev-multi")
        assert result.total == 5
        assert len(result.entries) == 5

    async def test_entries_isolated_by_device_id(self):
        repo = InMemoryRepository()
        payload_a = EntryRequest(
            device_id="dev-a",
            activity_type="crowd_report",
            description="Entry for A",
            severity="info",
        )
        payload_b = EntryRequest(
            device_id="dev-b",
            activity_type="incident_log",
            description="Entry for B",
            severity="warning",
        )
        await repo.create_entry(payload_a)
        await repo.create_entry(payload_b)
        result_a = await repo.get_entries_by_device("dev-a")
        result_b = await repo.get_entries_by_device("dev-b")
        assert result_a.total == 1
        assert result_b.total == 1
        assert result_a.entries[0].device_id == "dev-a"
        assert result_b.entries[0].device_id == "dev-b"


class TestHealthCheck:
    async def test_health_check_returns_true(self):
        repo = InMemoryRepository()
        result = await repo.health_check()
        assert result is True


class TestClear:
    async def test_clear_purges_all_data(self):
        repo = InMemoryRepository()
        payload = EntryRequest(
            device_id="dev-clear",
            activity_type="crowd_report",
            description="Test entry",
            severity="info",
        )
        await repo.create_entry(payload)
        await repo.clear()
        result = await repo.get_entries_by_device("dev-clear")
        assert result.total == 0

    async def test_clear_on_empty_repo_does_not_raise(self):
        repo = InMemoryRepository()
        await repo.clear()
        result = await repo.health_check()
        assert result is True
