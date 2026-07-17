"""
Abstract base class for the data repository layer.
Defines the contract for CRUD operations on volunteer activity entries.
"""

from abc import ABC, abstractmethod

from app.models.schemas import EntryRequest, EntryResponse, EntriesListResponse


class AbstractRepository(ABC):
    """Abstract repository defining the storage contract."""

    @abstractmethod
    async def create_entry(self, entry: EntryRequest) -> EntryResponse:
        """Create a new activity log entry and return it with generated metadata."""
        ...

    @abstractmethod
    async def get_entries_by_device(self, device_id: str) -> EntriesListResponse:
        """Retrieve all entries for a given anonymous device_id."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the repository is healthy and reachable."""
        ...
