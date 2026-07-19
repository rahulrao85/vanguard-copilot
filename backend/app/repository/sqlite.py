import uuid
from datetime import UTC, datetime
from pathlib import Path

import aiosqlite

from app.models.schemas import EntriesListResponse, EntryRequest, EntryResponse
from app.repository.base import AbstractRepository

CREATE_ENTRIES_TABLE = """
CREATE TABLE IF NOT EXISTS entries (
    entry_id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    severity TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'logged'
)
"""

CREATE_DEVICE_ID_INDEX = """
CREATE INDEX IF NOT EXISTS idx_entries_device_id ON entries(device_id)
"""

INSERT_ENTRY = """
INSERT INTO entries
    (entry_id, device_id, activity_type, description, location, severity, created_at, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

SELECT_ENTRIES_BY_DEVICE = """
SELECT entry_id, device_id, activity_type, description, location, severity, created_at, status
FROM entries
WHERE device_id = ?
ORDER BY created_at DESC
"""

SELECT_COUNT_BY_DEVICE = """
SELECT COUNT(*) FROM entries WHERE device_id = ?
"""


class SqliteRepository(AbstractRepository):
    def __init__(self, db_path: str = "/data/vanguard.db") -> None:
        self._db_path = db_path

    async def _get_connection(self) -> aiosqlite.Connection:
        db_dir = Path(self._db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        conn = await aiosqlite.connect(self._db_path)
        conn.row_factory = aiosqlite.Row
        await conn.execute(CREATE_ENTRIES_TABLE)
        await conn.execute(CREATE_DEVICE_ID_INDEX)
        await conn.commit()
        return conn

    async def create_entry(self, entry: EntryRequest) -> EntryResponse:
        entry_id = str(uuid.uuid4())
        now = datetime.now(UTC).isoformat()
        conn = await self._get_connection()
        try:
            await conn.execute(
                INSERT_ENTRY,
                (
                    entry_id,
                    entry.device_id,
                    entry.activity_type,
                    entry.description,
                    entry.location,
                    entry.severity,
                    now,
                    "logged",
                ),
            )
            await conn.commit()
        finally:
            await conn.close()
        return EntryResponse(
            entry_id=entry_id,
            device_id=entry.device_id,
            activity_type=entry.activity_type,
            description=entry.description,
            location=entry.location,
            severity=entry.severity,
            created_at=now,
            status="logged",
        )

    async def get_entries_by_device(self, device_id: str) -> EntriesListResponse:
        conn = await self._get_connection()
        try:
            cursor = await conn.execute(SELECT_ENTRIES_BY_DEVICE, (device_id,))
            rows = await cursor.fetchall()
            count_cursor = await conn.execute(SELECT_COUNT_BY_DEVICE, (device_id,))
            total_row = await count_cursor.fetchone()
            total = total_row[0] if total_row else 0
        finally:
            await conn.close()
        entries = [EntryResponse(**dict(row)) for row in rows]
        return EntriesListResponse(device_id=device_id, entries=entries, total=total)

    async def health_check(self) -> bool:
        try:
            conn = await self._get_connection()
            await conn.execute("SELECT 1")
            await conn.close()
            return True
        except Exception:
            return False

    async def clear(self) -> None:
        conn = await self._get_connection()
        try:
            await conn.execute("DELETE FROM entries")
            await conn.commit()
        finally:
            await conn.close()
