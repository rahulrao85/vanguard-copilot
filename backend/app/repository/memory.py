"""
In-memory repository implementation for local development and testing.
Provides a thread-safe dictionary-based storage layer that requires no
external credentials or network access.
"""

import asyncio
import uuid
from datetime import UTC, datetime

from app.models.schemas import EntriesListResponse, EntryRequest, EntryResponse
from app.repository.base import AbstractRepository


class InMemoryRepository(AbstractRepository):
    """Thread-safe in-memory storage for volunteer activity entries."""

    def __init__(self) -> None:
        self._store: dict[str, dict[str, list[dict[str, object]]]] = {}
        self._lock = asyncio.Lock()

    async def create_entry(self, entry: EntryRequest) -> EntryResponse:
        """Store a new activity entry in memory and return the response."""
        entry_id = str(uuid.uuid4())
        now = datetime.now(UTC).isoformat()

        response = EntryResponse(
            entry_id=entry_id,
            device_id=entry.device_id,
            activity_type=entry.activity_type,
            description=entry.description,
            location=entry.location,
            severity=entry.severity,
            created_at=now,
            status="logged",
        )

        async with self._lock:
            if entry.device_id not in self._store:
                self._store[entry.device_id] = {"entries": []}
            self._store[entry.device_id]["entries"].append(response.model_dump())

        return response

    async def get_entries_by_device(self, device_id: str) -> EntriesListResponse:
        """Retrieve all stored entries for a given device_id."""
        async with self._lock:
            device_data = self._store.get(device_id, {"entries": []})
            entries_raw = device_data.get("entries", [])
            entries = [EntryResponse(**e) for e in entries_raw]

        return EntriesListResponse(
            device_id=device_id,
            entries=entries,
            total=len(entries),
        )

    async def health_check(self) -> bool:
        """Always returns True for in-memory store (no external dependency)."""
        return True

    async def clear(self) -> None:
        """Purge all stored data. Used for test isolation."""
        async with self._lock:
            self._store.clear()
