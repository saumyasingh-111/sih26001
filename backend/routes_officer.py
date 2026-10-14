from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json
from backend.database import get_db, log_action
from backend.auth import require_role, get_data_mode

router = APIRouter(prefix="/api/officer", tags=["Officer Control Center"])

class CitizenReportReview(BaseModel):
    status: str # VERIFIED, REJECTED, RESOLVED
    severity: Optional[str] = None # LOW, MODERATE, HIGH, CRITICAL
    officer_notes: str

class FieldObservationReview(BaseModel):
    status: str # REVIEWED, ESCALATED_TO_INCIDENT, RESOLVED
    officer_notes: str
    create_incident: Optional[bool] = False

class ZoneAssignmentRequest(BaseModel):
    zone_id: str
    reporter_id: int
    reporting_interval_hours: int
    vulnerability_notes: Optional[str] = ""

class AlertCreateRequest(BaseModel):
    title: str
    level: str # LOW, MODERATE, HIGH, CRITICAL
    location: str
    district: str
    cause: str
    risk_score: int
    is_public: bool
    target_areas: str
    safety_instructions: str

class AlertPublishToggle(BaseModel):
    is_public: bool
    status: Optional[str] = "PUBLISHED"

class RescueTaskAssignment(BaseModel):
    incident_id: Optional[str] = None
    alert_id: Optional[str] = None
    team_id: int
    title: str
    district: str
    location: str
    lat: float
    lon: float
    severity: str
    hazard_details: str
    instructions: str
    safe_routes: Optional[List[Dict[str, Any]]] = None

class IncidentResolveRequest(BaseModel):
    resolution_notes: str

class UserRoleUpdate(BaseModel):
    role: str # citizen, field_reporter, officer, rescue_team
    district: Optional[str] = None

@router.get("/overview")
def get_control_center_overview(
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    """
    Consolidated overview for Officer Control Center with categorized counts
    filtered by Live vs Demo mode:
    - AI-predicted risk zones
    - Unverified citizen reports
    - Unverified field observations
    - Officer-verified incidents
    - Active response operations
    - Resolved incidents
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM citizen_reports WHERE status = 'PENDING_REVIEW' AND is_demo = ?;", (is_demo,))
    unverified_citizen = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM field_observations WHERE status = 'SUBMITTED' AND is_demo = ?;", (is_demo,))
    unverified_field = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE officer_decision = 'APPROVED' AND response_status != 'RESOLVED' AND is_demo = ?;", (is_demo,))
    active_incidents = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE response_status = 'RESOLVED' AND is_demo = ?;", (is_demo,))
    resolved_incidents = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM alerts WHERE status = 'PUBLISHED' AND is_public = 1 AND is_demo = ?;", (is_demo,))
    published_public_alerts = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM rescue_tasks WHERE status NOT IN ('COMPLETED') AND is_demo = ?;", (is_demo,))
    active_rescue_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM monitoring_zones WHERE is_demo = ?;", (is_demo,))
    total_zones = cursor.fetchone()[0]

    conn.close()

    return {
        "metrics": {
            "unverified_citizen_reports": unverified_citizen,
            "unverified_field_observations": unverified_field,
            "active_verified_incidents": active_incidents,
            "active_rescue_deployments": active_rescue_tasks,
            "published_public_alerts": published_public_alerts,
            "resolved_incidents": resolved_incidents,
            "monitored_zones": total_zones,
        },
        "is_demo": is_demo,
        "system_status": "OPERATIONAL",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# ---------------------------------------------------------------------------
# 1. Incident Monitoring & Incoming Feeds
# ---------------------------------------------------------------------------

@router.get("/citizen-reports")
def list_citizen_reports(
    district: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM citizen_reports WHERE is_demo = ?"
    params = [is_demo]

    if district and district.lower() != "all":
        query += " AND LOWER(district) = LOWER(?)"
        params.append(district)
    if status_filter and status_filter.lower() != "all":
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY created_at DESC;"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return {"reports": [dict(r) for r in rows], "is_demo": is_demo}

@router.put("/citizen-reports/{report_id}/review")
def review_citizen_report(
    report_id: str,
    payload: CitizenReportReview,
    current_user: dict = Depends(require_role(["officer"])),
):
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT * FROM citizen_reports WHERE id = ?", (report_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Citizen report not found.")

    severity = payload.severity or existing["severity"]
    cursor.execute("""
        UPDATE citizen_reports
        SET status = ?, severity = ?, officer_notes = ?, verified_by = ?, updated_at = ?
        WHERE id = ?;
    """, (payload.status, severity, payload.officer_notes, current_user["full_name"], now, report_id))
    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        f"CITIZEN_REPORT_{payload.status}",
        "REPORT",
        report_id,
        f"Officer updated status to {payload.status}. Notes: {payload.officer_notes}"
    )

    return {"success": True, "report_id": report_id, "status": payload.status, "updated_at": now}

@router.get("/field-observations")
def list_field_observations(
    district: Optional[str] = None,
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM field_observations WHERE is_demo = ?"
    params = [is_demo]
    if district and district.lower() != "all":
        query += " AND LOWER(district) = LOWER(?)"
        params.append(district)
    query += " ORDER BY created_at DESC;"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    observations = []
    for r in rows:
        item = dict(r)
        try:
            item["sensor_readings"] = json.loads(item["sensor_readings"])
        except Exception:
            item["sensor_readings"] = {}
        observations.append(item)

    return {"observations": observations, "is_demo": is_demo}

@router.put("/field-observations/{obs_id}/review")
def review_field_observation(
    obs_id: str,
    payload: FieldObservationReview,
    current_user: dict = Depends(require_role(["officer"])),
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM field_observations WHERE id = ?", (obs_id,))
    obs = cursor.fetchone()
    if not obs:
        conn.close()
        raise HTTPException(status_code=404, detail="Observation not found.")

    now = datetime.now(timezone.utc).isoformat()
    escalated_incident_id = obs["escalated_incident_id"]
    obs_is_demo = obs["is_demo"]

    if payload.create_incident:
        escalated_incident_id = f"SNR-{datetime.now().strftime('%Y')}-{int(datetime.now().timestamp()) % 100000}"
        timeline = [
            {"id": "t1", "time": datetime.now().strftime("%H:%M"), "label": "Reported", "detail": f"Observation {obs_id} escalated by {current_user['full_name']}", "tone": "reported"},
            {"id": "t2", "time": datetime.now().strftime("%H:%M"), "label": "Verified", "detail": payload.officer_notes, "tone": "verified"},
        ]
        resources = [
            {"id": "clearance", "name": "Heavy Road Clearance Unit", "recommended": 1, "available": 2, "assigned": 0, "unit": "units"},
            {"id": "evacuation", "name": "Rescue Squad", "recommended": 2, "available": 3, "assigned": 0, "unit": "squads"},
        ]
        routes = [
            {"id": "route-c", "name": "Corridor Charlie (Ridge Crest Bypass)", "status": "RECOMMENDED", "distance": "24.6 km", "travelTime": "45 min", "risk": "Low", "reason": "Clear bypass"},
            {"id": "route-a", "name": "Highway NH-102", "status": "BLOCKED", "distance": "14.0 km", "travelTime": "Closed", "risk": "Extreme", "reason": "Active slide zone"},
        ]
        cursor.execute("""
            INSERT INTO incidents (
                id, title, location, district, lat, lon, severity, risk_score, priority_score, confidence,
                connectivity, last_signal, affected_area, officer_decision, decision_reason, response_status,
                source_type, source_id, timeline, resources, routes, verified_by, is_demo, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'CRITICAL', 90, 92, 88, 'LIMITED', 'Just now', '10.5 km²', 'APPROVED', ?, 'APPROVED FOR RESPONSE', 'FIELD_OBSERVATION', ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            escalated_incident_id,
            f"Escalated Hazard from Observation {obs_id}",
            obs["location"],
            obs["district"],
            obs["lat"],
            obs["lon"],
            payload.officer_notes,
            obs_id,
            json.dumps(timeline),
            json.dumps(resources),
            json.dumps(routes),
            current_user["full_name"],
            obs_is_demo,
            now,
            now
        ))

    cursor.execute("""
        UPDATE field_observations
        SET status = ?, officer_notes = ?, escalated_incident_id = ?
        WHERE id = ?;
    """, (payload.status, payload.officer_notes, escalated_incident_id, obs_id))

    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        f"FIELD_OBSERVATION_{payload.status}",
        "OBSERVATION",
        obs_id,
        f"Reviewed observation. Notes: {payload.officer_notes}. Escalated to incident: {escalated_incident_id}"
    )

    return {
        "success": True,
        "observation_id": obs_id,
        "status": payload.status,
        "escalated_incident_id": escalated_incident_id
    }

# ---------------------------------------------------------------------------
# 2. Alert Management
# ---------------------------------------------------------------------------

@router.get("/alerts")
def list_all_alerts(
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE is_demo = ? ORDER BY created_at DESC;", (is_demo,))
    rows = cursor.fetchall()
    conn.close()
    return {"alerts": [dict(r) for r in rows], "is_demo": is_demo}

@router.post("/alerts")
def create_alert(
    payload: AlertCreateRequest,
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    alert_id = f"ALT-{int(datetime.now().timestamp()) % 1000}"

    cursor.execute("""
        INSERT INTO alerts (
            id, title, level, location, district, cause, risk_score, status, is_public,
            published_by, target_areas, safety_instructions, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?);
    """, (
        alert_id,
        payload.title,
        payload.level,
        payload.location,
        payload.district,
        payload.cause,
        payload.risk_score,
        1 if payload.is_public else 0,
        current_user["full_name"],
        payload.target_areas,
        payload.safety_instructions,
        is_demo,
        now,
        now
    ))
    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "ALERT_CREATED",
        "ALERT",
        alert_id,
        f"Created {payload.level} alert for {payload.location} (Public={payload.is_public}, mode={'demo' if is_demo else 'live'})"
    )

    return {"success": True, "alert_id": alert_id, "is_public": payload.is_public, "status": "PUBLISHED", "is_demo": is_demo}

@router.put("/alerts/{alert_id}/publish")
def toggle_alert_publish(
    alert_id: str,
    payload: AlertPublishToggle,
    current_user: dict = Depends(require_role(["officer"])),
):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        UPDATE alerts
        SET is_public = ?, status = ?, published_by = ?, updated_at = ?
        WHERE id = ?;
    """, (1 if payload.is_public else 0, payload.status or "PUBLISHED", current_user["full_name"], now, alert_id))
    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "ALERT_PUBLISH_TOGGLED",
        "ALERT",
        alert_id,
        f"Updated alert publish state: is_public={payload.is_public}, status={payload.status}"
    )

    return {"success": True, "alert_id": alert_id, "is_public": payload.is_public, "status": payload.status}

# ---------------------------------------------------------------------------
# 3. Field Reporter Management
# ---------------------------------------------------------------------------

@router.get("/zones")
def list_zones(
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM monitoring_zones WHERE is_demo = ? ORDER BY id ASC;", (is_demo,))
    rows = cursor.fetchall()
    conn.close()
    return {"zones": [dict(r) for r in rows], "is_demo": is_demo}

@router.get("/field-reporters")
def list_field_reporters(current_user: dict = Depends(require_role(["officer"]))):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, email, district, phone, badge_or_unit FROM users WHERE role = 'field_reporter';")
    rows = cursor.fetchall()
    conn.close()
    return {"reporters": [dict(r) for r in rows]}

@router.post("/zones/assign")
def assign_zone_reporter(
    payload: ZoneAssignmentRequest,
    current_user: dict = Depends(require_role(["officer"])),
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT full_name FROM users WHERE id = ? AND role = 'field_reporter'", (payload.reporter_id,))
    reporter = cursor.fetchone()
    if not reporter:
        conn.close()
        raise HTTPException(status_code=400, detail="Field reporter not found.")

    reporter_name = reporter["full_name"]
    cursor.execute("""
        UPDATE monitoring_zones
        SET assigned_reporter_id = ?, assigned_reporter_name = ?, reporting_interval_hours = ?,
            vulnerability_notes = ?, next_report_due = 'In ' || ? || ' hours'
        WHERE id = ?;
    """, (payload.reporter_id, reporter_name, payload.reporting_interval_hours, payload.vulnerability_notes or "", payload.reporting_interval_hours, payload.zone_id))
    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "ZONE_REPORTER_ASSIGNED",
        "ZONE",
        payload.zone_id,
        f"Assigned zone {payload.zone_id} to reporter {reporter_name} (Interval: {payload.reporting_interval_hours}h)"
    )

    return {"success": True, "zone_id": payload.zone_id, "assigned_to": reporter_name}

# ---------------------------------------------------------------------------
# 4. Rescue Coordination
# ---------------------------------------------------------------------------

@router.get("/rescue-teams")
def list_rescue_teams(current_user: dict = Depends(require_role(["officer"]))):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, email, district, phone, badge_or_unit FROM users WHERE role = 'rescue_team';")
    rows = cursor.fetchall()
    conn.close()
    return {"rescue_teams": [dict(r) for r in rows]}

@router.get("/rescue-tasks")
def list_rescue_tasks(
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()
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

    return {"rescue_tasks": tasks, "is_demo": is_demo}

@router.post("/rescue-tasks")
def assign_rescue_task(
    payload: RescueTaskAssignment,
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT full_name FROM users WHERE id = ? AND role = 'rescue_team'", (payload.team_id,))
    team = cursor.fetchone()
    if not team:
        conn.close()
        raise HTTPException(status_code=400, detail="Authorized rescue team not found.")

    team_name = team["full_name"]
    now = datetime.now(timezone.utc).isoformat()
    task_id = f"TASK-{int(datetime.now().timestamp()) % 1000}"

    task_is_demo = is_demo
    # If linked to incident, inherit incident's demo flag
    if payload.incident_id:
        cursor.execute("SELECT is_demo FROM incidents WHERE id = ?", (payload.incident_id,))
        inc_check = cursor.fetchone()
        if inc_check:
            task_is_demo = inc_check["is_demo"]

    routes_json = json.dumps(payload.safe_routes or [])
    progress_init = json.dumps([{
        "id": "p0",
        "time": datetime.now().strftime("%H:%M"),
        "status": "ASSIGNED",
        "notes": f"Task assigned by Officer {current_user['full_name']}. Instructions dispatched.",
        "casualties": 0,
        "affected_people": 0,
        "road_status": "Assessing routes",
    }])

    cursor.execute("""
        INSERT INTO rescue_tasks (
            id, incident_id, alert_id, team_id, team_name, title, district, location, lat, lon,
            severity, hazard_details, safe_routes, instructions, assigned_by, status,
            progress_updates, casualties_count, affected_people_count, road_blocked, assistance_notes,
            is_demo, assigned_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?, 0, 0, 1, '', ?, ?, ?);
    """, (
        task_id,
        payload.incident_id or "",
        payload.alert_id or "",
        payload.team_id,
        team_name,
        payload.title,
        payload.district,
        payload.location,
        payload.lat,
        payload.lon,
        payload.severity,
        payload.hazard_details,
        routes_json,
        payload.instructions,
        current_user["full_name"],
        progress_init,
        task_is_demo,
        now,
        now
    ))

    # If linked to incident, append timeline
    if payload.incident_id:
        cursor.execute("SELECT timeline FROM incidents WHERE id = ?", (payload.incident_id,))
        inc_row = cursor.fetchone()
        if inc_row:
            try:
                timeline = json.loads(inc_row["timeline"])
            except Exception:
                timeline = []
            timeline.append({
                "id": f"task-{task_id}",
                "time": datetime.now().strftime("%H:%M"),
                "label": "Assigned",
                "detail": f"Dispatched {team_name} to {payload.location}",
                "tone": "assigned"
            })
            cursor.execute("UPDATE incidents SET response_status = 'RESPONDING', timeline = ?, updated_at = ? WHERE id = ?", (json.dumps(timeline), now, payload.incident_id))

    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "RESCUE_TASK_ASSIGNED",
        "RESCUE_TASK",
        task_id,
        f"Assigned rescue mission {payload.title} to {team_name} (mode={'demo' if task_is_demo else 'live'})"
    )

    return {"success": True, "task_id": task_id, "assigned_to": team_name, "status": "ASSIGNED", "is_demo": task_is_demo}

# ---------------------------------------------------------------------------
# 5. Incident Verification and Resolution
# ---------------------------------------------------------------------------

@router.get("/incidents")
def list_incidents(
    current_user: dict = Depends(require_role(["officer"])),
    is_demo: int = Depends(get_data_mode),
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE is_demo = ? ORDER BY created_at DESC;", (is_demo,))
    rows = cursor.fetchall()
    conn.close()

    incidents = []
    for r in rows:
        item = dict(r)
        try:
            item["timeline"] = json.loads(item["timeline"])
            item["resources"] = json.loads(item["resources"])
            item["routes"] = json.loads(item["routes"])
        except Exception:
            pass
        incidents.append(item)

    return {"incidents": incidents, "is_demo": is_demo}

@router.put("/incidents/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    payload: IncidentResolveRequest,
    current_user: dict = Depends(require_role(["officer"])),
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT timeline FROM incidents WHERE id = ?", (incident_id,))
    inc_row = cursor.fetchone()
    if not inc_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        timeline = json.loads(inc_row["timeline"])
    except Exception:
        timeline = []

    now = datetime.now(timezone.utc).isoformat()
    timeline.append({
        "id": f"resolve-{int(datetime.now().timestamp())}",
        "time": datetime.now().strftime("%H:%M"),
        "label": "Resolved",
        "detail": f"Incident formally closed by Officer {current_user['full_name']}. Note: {payload.resolution_notes}",
        "tone": "resolved"
    })

    cursor.execute("""
        UPDATE incidents
        SET response_status = 'RESOLVED', officer_decision = 'APPROVED', timeline = ?, updated_at = ?
        WHERE id = ?;
    """, (json.dumps(timeline), now, incident_id))

    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "INCIDENT_RESOLVED",
        "INCIDENT",
        incident_id,
        f"Incident {incident_id} formally resolved. Resolution notes: {payload.resolution_notes}"
    )

    return {"success": True, "incident_id": incident_id, "status": "RESOLVED", "updated_at": now}

# ---------------------------------------------------------------------------
# 6. Audit Trail & User Admin
# ---------------------------------------------------------------------------

@router.get("/audit-logs")
def get_audit_logs(current_user: dict = Depends(require_role(["officer"]))):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100;")
    rows = cursor.fetchall()
    conn.close()
    return {"audit_logs": [dict(r) for r in rows]}

@router.get("/users")
def list_all_users(current_user: dict = Depends(require_role(["officer"]))):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, full_name, role, district, phone, badge_or_unit, created_at FROM users ORDER BY id ASC;")
    rows = cursor.fetchall()
    conn.close()
    return {"users": [dict(r) for r in rows]}

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    current_user: dict = Depends(require_role(["officer"])),
):
    if payload.role not in ["citizen", "field_reporter", "officer", "rescue_team"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = ? WHERE id = ?;", (payload.role, user_id))
    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "USER_ROLE_UPDATED",
        "USER",
        str(user_id),
        f"Updated role for user {user_id} to {payload.role}"
    )

    return {"success": True, "user_id": user_id, "role": payload.role}
