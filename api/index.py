import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request

import database


def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s).replace(" ", "T"))
    except (ValueError, TypeError):
        return None


def _normalize(body):
    body = dict(body)
    for k in ("description", "timer_started_at"):
        if body.get(k) == "":
            body[k] = None
    if "deadline" in body:
        body["deadline"] = _parse_dt(body["deadline"]) if body["deadline"] else None
    if "timer_started_at" in body:
        body["timer_started_at"] = _parse_dt(body["timer_started_at"]) if body["timer_started_at"] else None
    if "timer_duration_minutes" in body:
        v = body["timer_duration_minutes"]
        body["timer_duration_minutes"] = int(v) if v not in (None, "", 0, "0") else None
    return body


def _serialize(task):
    out = dict(task)
    for k in ("created_at", "deadline", "timer_started_at", "done_at"):
        v = out.get(k)
        if v is not None and hasattr(v, "isoformat"):
            out[k] = v.isoformat()
    out["has_timer"] = bool(out.get("has_timer"))
    return out


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_pool()
    yield
    await database.close_pool()


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/tasks")
async def api_list_tasks():
    rows = await database.list_tasks()
    return [_serialize(r) for r in rows]


@app.post("/api/tasks")
async def api_create_task(req: Request):
    body = _normalize(await req.json())
    title = (body.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    if body.get("priority") not in (None, "critical", "high", "normal", "low"):
        raise HTTPException(status_code=400, detail="invalid priority")
    if body.get("status") not in (None, "pending", "in_progress", "done"):
        raise HTTPException(status_code=400, detail="invalid status")
    body["title"] = title
    new_id = await database.create_task(body)
    return {"id": new_id}


@app.put("/api/tasks/{task_id}")
async def api_update_task(task_id: int, req: Request):
    body = _normalize(await req.json())
    if "title" in body:
        body["title"] = (body["title"] or "").strip()
        if not body["title"]:
            raise HTTPException(status_code=400, detail="title cannot be empty")
    if "priority" in body and body["priority"] not in ("critical", "high", "normal", "low"):
        raise HTTPException(status_code=400, detail="invalid priority")
    if "status" in body and body["status"] not in ("pending", "in_progress", "done"):
        raise HTTPException(status_code=400, detail="invalid status")
    await database.update_task(task_id, body)
    return {"ok": True}


@app.delete("/api/tasks/{task_id}")
async def api_delete_task(task_id: int):
    await database.delete_task(task_id)
    return {"ok": True}
