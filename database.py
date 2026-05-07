import os
import asyncpg
from datetime import datetime

DATABASE_URL = os.environ["DATABASE_URL"]

_pool = None

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS tasks (
    id                     SERIAL PRIMARY KEY,
    title                  VARCHAR(120) NOT NULL,
    description            VARCHAR(300),
    priority               VARCHAR(20)  NOT NULL DEFAULT 'normal'
                               CHECK (priority IN ('critical','high','normal','low')),
    status                 VARCHAR(20)  NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','in_progress','done')),
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    deadline               TIMESTAMP,
    has_timer              BOOLEAN      NOT NULL DEFAULT FALSE,
    timer_duration_minutes INTEGER,
    timer_started_at       TIMESTAMP,
    done_at                TIMESTAMP
)
"""


async def init_pool():
    global _pool
    _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5, ssl="require")
    async with _pool.acquire() as conn:
        await conn.execute(CREATE_TABLE_SQL)


async def close_pool():
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def list_tasks():
    sql = """
    SELECT id, title, description, priority, status, created_at, deadline,
           has_timer, timer_duration_minutes, timer_started_at, done_at
    FROM tasks
    ORDER BY
        (status = 'done')::int ASC,
        CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high'     THEN 2
            WHEN 'normal'   THEN 3
            ELSE 4
        END,
        CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
        deadline ASC NULLS LAST,
        id ASC
    """
    async with _pool.acquire() as conn:
        rows = await conn.fetch(sql)
        return [dict(r) for r in rows]


async def create_task(data):
    done_at_expr = "NOW()" if data.get("status") == "done" else "NULL"
    sql = f"""
    INSERT INTO tasks
        (title, description, priority, status, deadline,
         has_timer, timer_duration_minutes, timer_started_at, done_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, {done_at_expr})
    RETURNING id
    """
    params = (
        data["title"],
        data.get("description") or None,
        data.get("priority") or "normal",
        data.get("status") or "pending",
        data.get("deadline") or None,
        bool(data.get("has_timer")),
        data.get("timer_duration_minutes") or None,
        data.get("timer_started_at") or None,
    )
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(sql, *params)
        return row["id"]


async def update_task(task_id, data):
    allowed = (
        "title", "description", "priority", "status", "deadline",
        "has_timer", "timer_duration_minutes", "timer_started_at",
    )
    fields = []
    params = []
    i = 1
    for key in allowed:
        if key in data:
            val = data[key]
            if key == "has_timer":
                val = bool(val)
            elif val == "":
                val = None
            fields.append(f"{key} = ${i}")
            params.append(val)
            i += 1
    if "status" in data:
        if data["status"] == "done":
            fields.append("done_at = COALESCE(done_at, NOW())")
        else:
            fields.append("done_at = NULL")
    if not fields:
        return
    params.append(task_id)
    sql = f"UPDATE tasks SET {', '.join(fields)} WHERE id = ${i}"
    async with _pool.acquire() as conn:
        await conn.execute(sql, *params)


async def delete_task(task_id):
    async with _pool.acquire() as conn:
        await conn.execute("DELETE FROM tasks WHERE id = $1", task_id)
