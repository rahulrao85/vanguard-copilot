"""
Google Cloud Firestore repository implementation.
Provides persistent, scalable storage for volunteer activity entries
backed by Firestore (NoSQL document database).
"""

import asyncio
import uuid
from datetime import UTC, datetime

from google.cloud import firestore

from app.config import settings
from app.models.schemas import EntriesListResponse, EntryRequest, EntryResponse
from app.repository.base import AbstractRepository


class FirestoreRepository(AbstractRepository):
    """Firestore-backed repository for production use."""

    def __init__(self) -> None:
        self._client = firestore.Client(project=settings.project_id)
        self._collection = self._client.collection(settings.firestore_collection)

    async def create_entry(self, entry: EntryRequest) -> EntryResponse:
        """Persist a new activity entry to Firestore."""
        entry_id = str(uuid.uuid4())
        now = datetime.now(UTC).isoformat()

        doc_data = {
            "entry_id": entry_id,
            "device_id": entry.device_id,
            "activity_type": entry.activity_type,
            "description": entry.description,
            "location": entry.location,
            "severity": entry.severity,
            "created_at": now,
            "status": "logged",
        }

        doc_ref = self._collection.document(entry_id)
        await asyncio.to_thread(doc_ref.set, doc_data)

        return EntryResponse.model_validate(doc_data)

    async def get_entries_by_device(self, device_id: str) -> EntriesListResponse:
        """Query Firestore for all entries matching the given device_id."""

        def _query() -> list[EntryResponse]:
            docs = (
                self._collection.where("device_id", "==", device_id)
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .stream()
            )
            results = []
            for doc in docs:
                data = doc.to_dict()
                if data:
                    results.append(EntryResponse.model_validate(data))
            return results

        entries = await asyncio.to_thread(_query)

        return EntriesListResponse(
            device_id=device_id,
            entries=entries,
            total=len(entries),
        )

    async def health_check(self) -> bool:
        """Verify Firestore connectivity by pinging the collection."""
        try:
            _ = await asyncio.to_thread(lambda: list(self._collection.limit(1).stream()))
            return True
        except Exception:
            return False
