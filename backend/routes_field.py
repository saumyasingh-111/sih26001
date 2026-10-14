from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import json
from backend.database import get_db, log_action
from backend.auth import require_role, get_data_mode

router = APIRouter(prefix="/api/field", tags=["Field Reporter Portal"])

class FieldObservationSubmission(BaseModel):
    zone_id: Optional[str] = None
    location: str
    district: str
    lat: float
    lon: float
    condition_category: str # STABLE, INCREASED_RISK, VISIBLE_CRACKS, SLOPE_MOVEMENT, FALLING_ROCKS, BLOCKED_ROADS, SUSPECTED_LANDSLIDE
    sensor_readings: Optional[Dict[str, Any]] = None # e.g. rainfall_rate_mm_hr, soil_moisture_pct, tilt_deg, pore_pressure_kpa
    description: str
    image_url: Optional[str] = ""
    is_urgent: Optional[bool] = False

class UrgentEscalationRequest(BaseModel):
    location: str
    district: str
    lat: float
    lon: float
    hazard_summary: str
    immediate_threat: str

@router.get("/my-zones")
def get_my_zones(
    current_user: dict = Depends(require_role(["field_reporter", "officer"])),
    is_demo: int = Depends(get_data_mode),
):
    """
    Returns only the monitoring zones assigned to this field reporter in the active mode.
    """
    conn = get_db()
    cursor = conn.cursor()

    # If field reporter, show only their assigned zones (or unassigned in their district) matching mode
    if current_user["role"] == "field_reporter":
        cursor.execute("""
            SELECT id, name, district, state, lat, lon, risk_level, assigned_reporter_id, assigned_reporter_name,
                   reporting_interval_hours, last_reported_at, next_report_due, status, vulnerability_notes, is_demo
            FROM monitoring_zones
            WHERE (assigned_reporter_id = ? OR assigned_reporter_id IS NULL) AND is_demo = ?
            ORDER BY id ASC;
        """, (current_user["id"], is_demo))
    else:
        cursor.execute("SELECT * FROM monitoring_zones WHERE is_demo = ? ORDER BY id ASC;", (is_demo,))

    rows = cursor.fetchall()
    conn.close()

    zones = [dict(row) for row in rows]
    return {
        "reporter_id": current_user["id"],
        "reporter_name": current_user["full_name"],
        "is_demo": is_demo,
        "assigned_zones": zones,
    }

@router.post("/observations")
def submit_observation(
    payload: FieldObservationSubmission,
    current_user: dict = Depends(require_role(["field_reporter", "officer"])),
    is_demo: int = Depends(get_data_mode),
):
    """
    Submit a field observation with sensor readings, geotagging, photos, and condition category.
    Tagged with is_demo to isolate live operational reports from demo mode.
    """
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    obs_id = f"FO-{int(datetime.now().timestamp()) % 100000}"

    sensor_str = json.dumps(payload.sensor_readings or {})

    cursor.execute("""
        INSERT INTO field_observations (
            id, reporter_id, reporter_name, zone_id, location, district, lat, lon,
            condition_category, sensor_readings, description, image_url, is_urgent,
            status, officer_notes, escalated_incident_id, is_demo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', '', '', ?, ?);
    """, (
        obs_id,
        current_user["id"],
        current_user["full_name"],
        payload.zone_id,
        payload.location,
        payload.district,
        payload.lat,
        payload.lon,
        payload.condition_category,
        sensor_str,
        payload.description,
        payload.image_url or "",
        1 if payload.is_urgent else 0,
        is_demo,
        now,
    ))

    # Update zone last_reported_at if zone_id provided
    if payload.zone_id:
        cursor.execute("""
            UPDATE monitoring_zones
            SET last_reported_at = ?, next_report_due = 'In ' || reporting_interval_hours || ' hours'
            WHERE id = ?;
        """, (now, payload.zone_id))

    conn.commit()
    conn.close()

    action_label = "FIELD_OBSERVATION_URGENT" if payload.is_urgent else "FIELD_OBSERVATION_SUBMITTED"
    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        action_label,
        "OBSERVATION",
        obs_id,
        f"Observation at {payload.location}: {payload.condition_category}" + (" (URGENT ESCALATION)" if payload.is_urgent else "") + f" (mode={'demo' if is_demo else 'live'})"
    )

    return {
        "success": True,
        "observation_id": obs_id,
        "status": "SUBMITTED",
        "is_urgent": payload.is_urgent,
        "is_demo": is_demo,
        "timestamp": now,
        "message": "Field observation synchronized with Officer Control Center."
    }

@router.get("/my-observations")
def get_my_observations(
    current_user: dict = Depends(require_role(["field_reporter", "officer"])),
    is_demo: int = Depends(get_data_mode),
):
    """
    Returns recent observations submitted by this reporter in current mode.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, zone_id, location, district, lat, lon, condition_category, sensor_readings,
               description, image_url, is_urgent, status, officer_notes, escalated_incident_id, is_demo, created_at
        FROM field_observations
        WHERE reporter_id = ? AND is_demo = ?
        ORDER BY created_at DESC;
    """, (current_user["id"], is_demo))
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

    return {
        "count": len(observations),
        "is_demo": is_demo,
        "observations": observations,
    }

@router.post("/urgent-escalation")
def urgent_escalation(
    payload: UrgentEscalationRequest,
    current_user: dict = Depends(require_role(["field_reporter", "officer"])),
    is_demo: int = Depends(get_data_mode),
):
    """
    Immediate escalation button for imminent slope collapse / life safety threat.
    Does not wait for next scheduled reporting interval.
    """
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    obs_id = f"URG-{int(datetime.now().timestamp()) % 100000}"

    sensor_str = json.dumps({"escalation_type": "IMMEDIATE_THREAT", "reported_threat": payload.immediate_threat})

    cursor.execute("""
        INSERT INTO field_observations (
            id, reporter_id, reporter_name, zone_id, location, district, lat, lon,
            condition_category, sensor_readings, description, image_url, is_urgent,
            status, officer_notes, escalated_incident_id, is_demo, created_at
        ) VALUES (?, ?, ?, '', ?, ?, ?, ?, 'SUSPECTED_LANDSLIDE', ?, ?, '', 1, 'SUBMITTED', 'URGENT ESCALATION FROM FIELD', '', ?, ?);
    """, (
        obs_id,
        current_user["id"],
        current_user["full_name"],
        payload.location,
        payload.district,
        payload.lat,
        payload.lon,
        sensor_str,
        f"URGENT: {payload.hazard_summary}. Immediate Threat: {payload.immediate_threat}",
        is_demo,
        now,
    ))
    conn.commit()
    conn.close()

    log_action(
        current_user["id"],
        current_user["username"],
        current_user["role"],
        "FIELD_URGENT_ESCALATION",
        "OBSERVATION",
        obs_id,
        f"CRITICAL ESCALATION for {payload.location}: {payload.immediate_threat} (mode={'demo' if is_demo else 'live'})"
    )

    return {
        "success": True,
        "escalation_id": obs_id,
        "message": "URGENT ESCALATION broadcast to Officer Control Center emergency queue.",
        "status": "ESCALATED",
        "is_demo": is_demo,
        "timestamp": now,
    }
