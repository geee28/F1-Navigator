"""
PostgreSQL data-access layer using asyncpg.
All UUIDs are stored as native PostgreSQL UUID columns.
"""

import os
from typing import Any

import asyncpg


class Database:
    def __init__(self) -> None:
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        url = os.getenv("DATABASE_URL", "")
        if not url:
            raise RuntimeError("DATABASE_URL env var is not set.")
        # asyncpg needs postgresql:// scheme (not postgres://)
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        self.pool = await asyncpg.create_pool(url, min_size=1, max_size=10)

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()

    # ── Users ─────────────────────────────────────────────────────────────────

    async def get_user_by_email(self, email: str) -> asyncpg.Record | None:
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(
                "SELECT id::text, email, password_hash FROM users WHERE email = $1",
                email,
            )

    async def get_user(self, user_id: str) -> asyncpg.Record | None:
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(
                "SELECT id::text, email FROM users WHERE id = $1::uuid",
                user_id,
            )

    async def create_user(self, email: str, password_hash: str) -> str:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id::text",
                email,
                password_hash,
            )
            return row["id"]

    # ── Profiles ──────────────────────────────────────────────────────────────

    async def create_profile(self, user_id: str, name: str) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO student_profiles (user_id, name) VALUES ($1::uuid, $2) "
                "ON CONFLICT (user_id) DO NOTHING",
                user_id,
                name,
            )

    async def get_profile(self, user_id: str) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT name, university, major, degree_level,
                          year_of_study, visa_status, country_of_origin
                   FROM student_profiles WHERE user_id = $1::uuid""",
                user_id,
            )
            return dict(row) if row else {}

    async def update_profile(self, user_id: str, data: dict) -> None:
        if not data:
            return
        keys   = list(data.keys())
        values = list(data.values())
        set_clause = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(keys))
        async with self.pool.acquire() as conn:
            await conn.execute(
                f"UPDATE student_profiles SET {set_clause}, updated_at = NOW() "
                f"WHERE user_id = $1::uuid",
                user_id,
                *values,
            )

    # ── Documents ─────────────────────────────────────────────────────────────

    async def list_documents(self, user_id: str) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT id::text, name, doc_type, file_data, file_size,
                          uploaded_at::text
                   FROM documents
                   WHERE user_id = $1::uuid
                   ORDER BY uploaded_at DESC""",
                user_id,
            )
            return [dict(r) for r in rows]

    async def save_document(self, user_id: str, data: dict) -> str:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO documents (user_id, name, doc_type, file_data, file_size)
                   VALUES ($1::uuid, $2, $3, $4, $5) RETURNING id::text""",
                user_id,
                data["name"],
                data["doc_type"],
                data.get("file_data", ""),
                data.get("file_size", 0),
            )
            return row["id"]

    async def delete_document(self, user_id: str, doc_id: str) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM documents WHERE id = $1::uuid AND user_id = $2::uuid",
                doc_id,
                user_id,
            )

    # ── Meetings ──────────────────────────────────────────────────────────────

    async def list_meetings(self, user_id: str) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT id::text, name, email,
                          preferred_date::text, preferred_time::text,
                          topic, details, status, created_at::text
                   FROM meetings
                   WHERE user_id = $1::uuid
                   ORDER BY created_at DESC""",
                user_id,
            )
            return [dict(r) for r in rows]

    async def create_meeting(self, user_id: str, data: dict) -> str:
        from datetime import date, time

        raw_date = data.get("preferred_date") or None
        raw_time = data.get("preferred_time") or None

        parsed_date = date.fromisoformat(raw_date) if raw_date else None
        parsed_time = time.fromisoformat(raw_time) if raw_time else None

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO meetings
                     (user_id, name, email, preferred_date, preferred_time, topic, details)
                   VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
                   RETURNING id::text""",
                user_id,
                data["name"],
                data["email"],
                parsed_date,
                parsed_time,
                data.get("topic", ""),
                data.get("details", ""),
            )
            return row["id"]
