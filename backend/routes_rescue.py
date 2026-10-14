from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json
from backend.database import get_db, log_action
from backend.auth import require_role, get_data_mode

router = APIRouter(prefix="/api/rescue", tags=["Rescue Operations Portal"])

class TaskStatusUpdate(BaseModel):
    status: str # ACKNOWLEDGED, MOBILIZED, ON_SITE, ASSISTANCE_REQUIRED, COMPLETED
    notes: Optional[str] = ""

class TaskProgressSubmission(BaseModel):
    status: str # ACKNOWLEDGED, MOBILIZED, ON_SITE, ASSISTANCE_REQUIRED, COMPLETED
    notes: str
    casualties: Optional[int] = 0
    affected_people: Optional[int] = 0
    road_status: Optional[str] = "Open"
    photo_url: Optional[str] = ""
    request_additional_support: Optional[bool] = False
    additional_support_details: Optional[str] = ""

@router.get("/my-tasks")
def get_my_tasks(
    current_user: dict = Depends(require_role(["rescue_team", "officer"])),
    is_demo: int = Depends(get_data_mode),
):
    """
    Returns only the emergency response tasks assigned to the logged-in rescue team in current mode.
    """
    conn = get_db()
    cursor = conn.cursor()

    if current_user["role"] == "rescue_team":
        cursor.execute("""
            SELECT * FROM rescue_tasks
            WHERE team_id = ? AND is_demo = ?
            ORDER BY updated_at DESC;
        """, (current_user["id"], is_demo))
    else:
        cursor.execute("SELECT * FROM rescue_tasks WHERE is_demo = ? ORDER BY updated_at DESC;", (is_demo,))

    rows = cursor.fetchall()
    conn.close()

    tasks = []
    for r in rows:
        item = dict(r)
        try:
            item["safe_routes"] = json.loads(item["safe_routes"])
            item["progress_updates"] = json.loads(item["progress_updates"])
        except Exception:
            pass
        tasks.append(item)

    return {
        "team_name": current_user["full_name"],
        "count": len(tasks),
        "is_demo": is_demo,
        "tasks": tasks,
    }

@router.put("/tasks/{task_id}/status")
def update_task_status(
    task_id: str,
    payload: TaskStatusUpdate,
    current_user: dict = Depends(require_role(["rescue_team", "officer"])),
):
    valid_statuses = ["ASSIGNED", "ACKNOWLEDGED", "MOBILIZED", "ON_SITE", "ASSISTANCE_REQUIRED", "COMPLETED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM rescue_tasks WHERE id = ?", (task_id,))
    task = cursor.fetchone()
    if not task:
        conn.close()
        raise HTTPException(status_code=404, detail="Rescue task not found.")

    # Check ownership if rescue team
    if current_user["role"] == "rescue_team" and task["team_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You can only update tasks assigned to your rescue unit.")

    now = datetime.now(timezone.utc).isoformat()
    completed_at = now if payload.status == "COMPLETED" else task["completed_at"]

    try:
        progress = json.loads(task["progress_updates"])
    except Exception:
        progress = []

    progress.append({
        "id": f"p-{int(datetime.now().timestamp())}",
        "time": datetime.now().strftime("%H:%M"),
        "status": payload.status,
        "notes": payload.notes or f"Status transitioned to {payload.status}",
        "casualties": task["casualties_count"],
        "affected_people": task["affected_people_count"],
        "road_status": "Blocked" if task["road_blocked"] else "Open",
    })

    cursor.execute("""
        UPDATE rescue_tasks
        SET status = ?, progress_updates = ?, updated_at = ?, completed_at = ?
        WHERE id = ?;
    """, (payload.status, json.dumps(progress), now, completed_at, task_id))

    # Also sync with central incident if linked
    if task["incident_id"]:
        inc_status = "RESPONDING" if payload.status != "COMPLETED" else "RESOLVED"
        cursor.execute("SELECT timeline FROM incidents WHERE id = ?", (task["incident_id"],))
        inc_row = cursor.fetchone()
        if inc_row:
            try:
                timeline = json.loads(inc_row["timeline"])
            except Exception:
                timeline = []
            timeline.append({
                "id": f"rescue-{task_id}-{int(datetime.now().timestamp())}",
                "time": datetime.now().strftime("%H:%M"),
                "label": "Responding" if payload.status != "COMPLETED" else "Resolved",
                "detail": f"{current_user['full_name']} updated response status to {payload.status}. {payload.notes}",
                "tone": "responding" if payload.status != "COMPLETED" else "resolved"
            })
            cursor.execute("""
                UPDATE incidents
                SET response_status = ?, timeline = ?, updated_at = ?
                WHERE id = ?;
            """, (inc_status, json.dumps(timeline), now, task["incident_id"]))

    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        f"RESCUE_STATUS_{payload.status}",
        "RESCUE_TASK",
        task_id,
        f"Rescue team {current_user['full_name']} set status to {payload.status}"
    )

    return {"success": True, "task_id": task_id, "status": payload.status, "updated_at": now}

@router.post("/tasks/{task_id}/updates")
def submit_progress_update(
    task_id: str,
    payload: TaskProgressSubmission,
    current_user: dict = Depends(require_role(["rescue_team", "officer"])),
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM rescue_tasks WHERE id = ?", (task_id,))
    task = cursor.fetchone()
    if not task:
        conn.close()
        raise HTTPException(status_code=404, detail="Rescue task not found.")

    if current_user["role"] == "rescue_team" and task["team_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized for this task.")

    now = datetime.now(timezone.utc).isoformat()
    try:
        progress = json.loads(task["progress_updates"])
    except Exception:
        progress = []

    update_entry = {
        "id": f"p-{int(datetime.now().timestamp())}",
        "time": datetime.now().strftime("%H:%M"),
        "status": payload.status,
        "notes": payload.notes,
        "casualties": payload.casualties or 0,
        "affected_people": payload.affected_people or 0,
        "road_status": payload.road_status or "Unknown",
        "photo_url": payload.photo_url or "",
        "additional_support_requested": payload.request_additional_support,
        "support_details": payload.additional_support_details or "",
    }
    progress.append(update_entry)

    road_blocked_val = 1 if "block" in (payload.road_status or "").lower() else 0
    assistance_notes_val = payload.additional_support_details if payload.request_additional_support else task["assistance_notes"]
    status_val = "ASSISTANCE_REQUIRED" if payload.request_additional_support else payload.status

    cursor.execute("""
        UPDATE rescue_tasks
        SET status = ?, progress_updates = ?, casualties_count = ?, affected_people_count = ?,
            road_blocked = ?, assistance_notes = ?, updated_at = ?
        WHERE id = ?;
    """, (
        status_val,
        json.dumps(progress),
        payload.casualties or task["casualties_count"],
        payload.affected_people or task["affected_people_count"],
        road_blocked_val,
        assistance_notes_val,
        now,
        task_id
    ))

    # Append to incident timeline
    if task["incident_id"]:
        cursor.execute("SELECT timeline FROM incidents WHERE id = ?", (task["incident_id"],))
        inc_row = cursor.fetchone()
        if inc_row:
            try:
                timeline = json.loads(inc_row["timeline"])
            except Exception:
                timeline = []
            timeline.append({
                "id": f"progress-{int(datetime.now().timestamp())}",
                "time": datetime.now().strftime("%H:%M"),
                "label": "Responding",
                "detail": f"Rescue progress: {payload.notes} (Casualties: {payload.casualties}, Affected: {payload.affected_people})",
                "tone": "responding"
            })
            cursor.execute("UPDATE incidents SET timeline = ?, updated_at = ? WHERE id = ?", (json.dumps(timeline), now, task["incident_id"]))

    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "RESCUE_PROGRESS_SUBMITTED",
        "RESCUE_TASK",
        task_id,
        f"Rescue update: {payload.notes} (Support requested: {payload.request_additional_support})"
    )

    return {
        "success": True,
        "task_id": task_id,
        "status": status_val,
        "updated_at": now,
        "message": "Progress update synced with Officer Control Center."
    }

@router.get("/my-history")
def get_rescue_history(current_user: dict = Depends(require_role(["rescue_team", "officer"]))):
    conn = get_db()
    cursor = conn.cursor()

    if current_user["role"] == "rescue_team":
        cursor.execute("""
            SELECT * FROM rescue_tasks
            WHERE team_id = ? AND status = 'COMPLETED'
            ORDER BY completed_at DESC;
        """, (current_user["id"],))
    else:
        cursor.execute("SELECT * FROM rescue_tasks WHERE status = 'COMPLETED' ORDER BY completed_at DESC;")

    rows = cursor.fetchall()
    conn.close()

    tasks = []
    for r in rows:
        item = dict(r)
        try:
            item["safe_routes"] = json.loads(item["safe_routes"])
            item["progress_updates"] = json.loads(item["progress_updates"])
        except Exception:
            pass
        tasks.append(item)

    return {"completed_tasks": tasks}
