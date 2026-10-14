from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import json
from backend.database import get_db, log_action
from backend.auth import get_optional_user, get_current_user, require_role, get_data_mode

router = APIRouter(prefix="/api/citizen", tags=["Citizen Portal"])

class CitizenReportSubmission(BaseModel):
    citizen_name: str
    phone: Optional[str] = ""
    location: str
    district: str
    lat: float
    lon: float
    report_type: str # Ground crack, Falling rocks, Unusual water flow, Road damage, Suspected slope movement, Other
    description: str
    image_url: Optional[str] = ""
    severity: Optional[str] = "MODERATE"

@router.get("/public-feed")
def get_public_feed(district: Optional[str] = None, is_demo: int = Depends(get_data_mode)):
    """
    Publicly accessible endpoint: returns official public alerts and public risk zones.
    Filters out internal officer notices or unverified operational data.
    Separates live operational alerts from demo scenarios.
    """
    conn = get_db()
    cursor = conn.cursor()

    # Only alerts where is_public = 1 and status = 'PUBLISHED' and matching is_demo
    if district and district.lower() != "all":
        cursor.execute("""
            SELECT id, title, level, location, district, cause, risk_score, status, target_areas, safety_instructions, is_demo, created_at, updated_at
            FROM alerts
            WHERE is_public = 1 AND status = 'PUBLISHED' AND is_demo = ? AND LOWER(district) = LOWER(?)
            ORDER BY created_at DESC;
        """, (is_demo, district))
    else:
        cursor.execute("""
            SELECT id, title, level, location, district, cause, risk_score, status, target_areas, safety_instructions, is_demo, created_at, updated_at
            FROM alerts
            WHERE is_public = 1 AND status = 'PUBLISHED' AND is_demo = ?
            ORDER BY created_at DESC;
        """, (is_demo,))
    alerts_rows = cursor.fetchall()

    alerts = [dict(row) for row in alerts_rows]

    # Public risk zones (derived from monitoring zones with public-safe info)
    cursor.execute("""
        SELECT id, name, district, state, lat, lon, risk_level, status, is_demo
        FROM monitoring_zones
        WHERE status = 'ACTIVE' AND is_demo = ?;
    """, (is_demo,))
    zones_rows = cursor.fetchall()
    zones = [dict(row) for row in zones_rows]

    conn.close()

    return {
        "alerts": alerts,
        "risk_zones": zones,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/safety-guidance")
def get_safety_guidance(district: Optional[str] = "Churachandpur", is_demo: int = Depends(get_data_mode)):
    """
    Emergency guidance, evacuation centers, and official contacts.
    Returns verified official contacts. Isolates demo shelters and evacuation corridors
    to demo mode only, returning an honest empty state for live mode when no official records exist.
    """
    contacts = [
        {"name": "District Emergency Operations Center (DEOC)", "phone": "1077 / 03874-233120", "role": "24x7 Control Room"},
        {"name": "State Disaster Response Force (SDRF)", "phone": "1070", "role": "Rapid Rescue & Evacuation"},
        {"name": "National Disaster Response Force (NDRF)", "phone": "011-24363260", "role": "Specialized Disaster Response"},
        {"name": "District Hospital Ambulance Service", "phone": "108", "role": "Emergency Medical Services"},
        {"name": "Police Control Room", "phone": "100 / 112", "role": "Road Traffic & Cordon Management"},
    ]

    if is_demo == 1:
        shelters = [
            {"name": "Community Multi-purpose Hall, Sector 4", "capacity": 250, "location": "High Ground Ridge Road", "status": "READY"},
            {"name": "Government Higher Secondary School Campus", "capacity": 400, "location": "Central District Bypass", "status": "ACTIVE_SHELTER"},
            {"name": "Indoor Stadium Shelter", "capacity": 500, "location": "West Valley High Mound", "status": "READY"},
        ]

        evacuation_routes = [
            {"name": "Ridge Crest Bypass (Corridor Charlie)", "status": "OPEN", "notes": "Clear of slope debris; recommended for Sector 4 residents."},
            {"name": "Valley Road (Corridor Bravo)", "status": "CAUTION", "notes": "Waterlogging reported near bridge; small vehicles avoid."},
            {"name": "NH-102 KM-42 Main Cut", "status": "BLOCKED", "notes": "Active mudflow; do not use under any circumstances."},
        ]
        status_message = "Demo emergency scenario loaded for Churachandpur sector."
    else:
        # In Live Mode, do NOT fabricate fake shelters or simulated evacuation corridors
        shelters = []
        evacuation_routes = []
        status_message = "No verified live shelter or evacuation records reported for this sector."

    return {
        "district": district,
        "emergency_contacts": contacts,
        "designated_shelters": shelters,
        "evacuation_routes": evacuation_routes,
        "is_demo": is_demo,
        "message": status_message,
    }

@router.post("/reports")
def submit_citizen_report(
    payload: CitizenReportSubmission,
    optional_user: Optional[dict] = Depends(get_optional_user),
    is_demo: int = Depends(get_data_mode),
):
    """
    Submit a citizen report with description, location, and photos.
    Can be called anonymously or by an authenticated citizen.
    Is tagged with is_demo to preserve Live vs Demo isolation.
    """
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    report_id = f"CR-{int(datetime.now().timestamp()) % 100000}"
    user_id = optional_user["id"] if optional_user else None
    citizen_name = payload.citizen_name or (optional_user["full_name"] if optional_user else "Resident")
    phone = payload.phone or (optional_user["phone"] if optional_user else "")

    cursor.execute("""
        INSERT INTO citizen_reports (
            id, user_id, citizen_name, phone, location, district, lat, lon,
            report_type, description, image_url, severity, status, officer_notes, verified_by, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW', '', '', ?, ?, ?);
    """, (
        report_id,
        user_id,
        citizen_name,
        phone,
        payload.location,
        payload.district,
        payload.lat,
        payload.lon,
        payload.report_type,
        payload.description,
        payload.image_url or "",
        payload.severity or "MODERATE",
        is_demo,
        now,
        now,
    ))
    conn.commit()
    conn.close()

    log_action(
        user_id or 0,
        citizen_name,
        "citizen",
        "CITIZEN_REPORT_SUBMITTED",
        "REPORT",
        report_id,
        f"Submitted warning report for {payload.location}: {payload.report_type} (mode={'demo' if is_demo else 'live'})"
    )

    return {
        "success": True,
        "report_id": report_id,
        "message": "Report submitted successfully to the Sentinel NER Officer Control Center for verification.",
        "status": "PENDING_REVIEW",
        "is_demo": is_demo,
        "created_at": now,
    }

@router.get("/my-reports")
def get_my_reports(
    current_user: dict = Depends(get_current_user),
    is_demo: int = Depends(get_data_mode),
):
    """
    Protected endpoint: Returns only the reports submitted by the logged-in citizen in the current mode.
    Does NOT leak other citizens' reports, nor cross live/demo modes.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, location, district, lat, lon, report_type, description, image_url, severity, status, officer_notes, verified_by, is_demo, created_at, updated_at
        FROM citizen_reports
        WHERE user_id = ? AND is_demo = ?
        ORDER BY created_at DESC;
    """, (current_user["id"], is_demo))
    rows = cursor.fetchall()
    conn.close()

    reports = [dict(row) for row in rows]
    return {
        "citizen_name": current_user["full_name"],
        "count": len(reports),
        "is_demo": is_demo,
        "reports": reports,
    }
