import sqlite3
import json
import hashlib
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "sentinel.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    # PBKDF2 HMAC SHA256 with fixed project salt for reproducible demo seeding
    salt = b"sentinel_ner_secure_salt_2026"
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return key.hex()

def verify_password(plain_password: str, hashed: str) -> bool:
    return hash_password(plain_password) == hashed

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- citizen, field_reporter, officer, rescue_team
        district TEXT DEFAULT 'Churachandpur',
        phone TEXT DEFAULT '',
        badge_or_unit TEXT DEFAULT '',
        created_at TEXT NOT NULL
    );
    """)

    # 2. Citizen Reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_reports (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        citizen_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        report_type TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        severity TEXT NOT NULL DEFAULT 'MODERATE',
        status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, VERIFIED, REJECTED, RESOLVED
        officer_notes TEXT DEFAULT '',
        verified_by TEXT DEFAULT '',
        is_demo INTEGER NOT NULL DEFAULT 0, -- 0 = Live operational, 1 = Demo scenario
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 3. Monitoring Zones (for Field Reporters)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS monitoring_zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        risk_level TEXT NOT NULL DEFAULT 'HIGH',
        assigned_reporter_id INTEGER,
        assigned_reporter_name TEXT DEFAULT '',
        reporting_interval_hours INTEGER NOT NULL DEFAULT 2,
        last_reported_at TEXT DEFAULT '',
        next_report_due TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        vulnerability_notes TEXT DEFAULT '',
        is_demo INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (assigned_reporter_id) REFERENCES users(id)
    );
    """)

    # 4. Field Observations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS field_observations (
        id TEXT PRIMARY KEY,
        reporter_id INTEGER NOT NULL,
        reporter_name TEXT NOT NULL,
        zone_id TEXT,
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        condition_category TEXT NOT NULL, -- STABLE, INCREASED_RISK, VISIBLE_CRACKS, SLOPE_MOVEMENT, FALLING_ROCKS, BLOCKED_ROADS, SUSPECTED_LANDSLIDE
        sensor_readings TEXT DEFAULT '{}', -- JSON: rainfall_rate, soil_moisture_pct, tilt_deg, pore_pressure
        description TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        is_urgent INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, REVIEWED, ESCALATED_TO_INCIDENT, RESOLVED
        officer_notes TEXT DEFAULT '',
        escalated_incident_id TEXT DEFAULT '',
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (zone_id) REFERENCES monitoring_zones(id)
    );
    """)

    # 5. Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        level TEXT NOT NULL, -- LOW, MODERATE, HIGH, CRITICAL
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        cause TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, RESOLVED
        is_public INTEGER NOT NULL DEFAULT 0, -- 1 = visible to citizens, 0 = internal only
        published_by TEXT DEFAULT '',
        target_areas TEXT DEFAULT 'All affected hill sectors',
        safety_instructions TEXT DEFAULT 'Avoid low-lying slope cuts and adhere to designated bypass corridors.',
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 6. Incidents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        severity TEXT NOT NULL DEFAULT 'HIGH',
        risk_score INTEGER NOT NULL DEFAULT 85,
        priority_score INTEGER NOT NULL DEFAULT 88,
        confidence INTEGER NOT NULL DEFAULT 85,
        connectivity TEXT NOT NULL DEFAULT 'CONNECTED', -- CONNECTED, LIMITED, BLACKOUT
        last_signal TEXT DEFAULT 'Just now',
        affected_area TEXT DEFAULT '12.4 km²',
        officer_decision TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, MODIFIED, REJECTED
        decision_reason TEXT DEFAULT '',
        response_status TEXT NOT NULL DEFAULT 'AWAITING APPROVAL', -- AWAITING APPROVAL, APPROVED FOR RESPONSE, RESPONDING, RESOLVED
        source_type TEXT NOT NULL DEFAULT 'OFFICER_REVIEW', -- AI_PREDICTION, CITIZEN_REPORT, FIELD_OBSERVATION, OFFICER_REVIEW
        source_id TEXT DEFAULT '',
        timeline TEXT DEFAULT '[]', -- JSON array of events
        resources TEXT DEFAULT '[]', -- JSON array of resources
        routes TEXT DEFAULT '[]', -- JSON array of safe routes
        verified_by TEXT DEFAULT '',
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 7. Rescue Tasks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rescue_tasks (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        alert_id TEXT,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        title TEXT NOT NULL,
        district TEXT NOT NULL,
        location TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        severity TEXT NOT NULL DEFAULT 'CRITICAL',
        hazard_details TEXT NOT NULL,
        safe_routes TEXT DEFAULT '[]', -- JSON array
        instructions TEXT NOT NULL,
        assigned_by TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ASSIGNED', -- ASSIGNED, ACKNOWLEDGED, MOBILIZED, ON_SITE, ASSISTANCE_REQUIRED, COMPLETED
        progress_updates TEXT DEFAULT '[]', -- JSON array of progress updates
        casualties_count INTEGER DEFAULT 0,
        affected_people_count INTEGER DEFAULT 0,
        road_blocked INTEGER DEFAULT 1,
        assistance_notes TEXT DEFAULT '',
        is_demo INTEGER NOT NULL DEFAULT 0,
        assigned_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT DEFAULT '',
        FOREIGN KEY (team_id) REFERENCES users(id),
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
    );
    """)

    # 8. Audit Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        details TEXT NOT NULL,
        is_demo INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL
    );
    """)

    # Migration: Ensure is_demo column exists on each table
    tables = ["citizen_reports", "monitoring_zones", "field_observations", "alerts", "incidents", "rescue_tasks", "audit_logs"]
    for tbl in tables:
        try:
            cursor.execute(f"ALTER TABLE {tbl} ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;")
        except sqlite3.OperationalError:
            pass # column already exists

    conn.commit()

    # Seed data if users table is empty
    cursor.execute("SELECT COUNT(*) FROM users;")
    if cursor.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()

def log_action(user_id: int, username: str, role: str, action: str, target_type: str, target_id: str, details: str, is_demo: int = 0):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT INTO audit_logs (user_id, username, role, action, target_type, target_id, details, is_demo, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (user_id, username, role, action, target_type, target_id, details, is_demo, now))
    conn.commit()
    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    # 1. Seed standard users (one for each role)
    users_data = [
        ("officer", "officer@sentinel.ner", hash_password("officer123"), "Officer Ananya Sharma", "officer", "Churachandpur", "+91 98765 43210", "NER-DISASTER-HQ"),
        ("field_monitor", "field@sentinel.ner", hash_password("field123"), "Rohan Singh", "field_reporter", "Churachandpur", "+91 98765 43211", "FIELD-UNIT-04"),
        ("rescue_alpha", "rescue@sentinel.ner", hash_password("rescue123"), "NDRF 12th Bn Unit Alpha", "rescue_team", "Churachandpur", "+91 98765 43212", "NDRF-ALPHA-01"),
        ("citizen_priya", "citizen@sentinel.ner", hash_password("citizen123"), "Priya Sharma", "citizen", "Churachandpur", "+91 98765 43213", "RESIDENT-SECTOR-4"),
    ]
    cursor.executemany("""
        INSERT INTO users (username, email, password_hash, full_name, role, district, phone, badge_or_unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, [(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], now) for u in users_data])

    field_user_id = cursor.execute("SELECT id FROM users WHERE role='field_reporter'").fetchone()[0]
    rescue_user_id = cursor.execute("SELECT id FROM users WHERE role='rescue_team'").fetchone()[0]
    citizen_user_id = cursor.execute("SELECT id FROM users WHERE role='citizen'").fetchone()[0]

    # 2. Seed Monitoring Zones (both live baseline & demo)
    zones_data = [
        ("ZONE-CP-01", "Churachandpur Hill Sector 4", "Churachandpur", "Manipur", 24.332, 93.671, "CRITICAL", field_user_id, "Rohan Singh", 2, now, "In 45 minutes", "ACTIVE", "Active ground crack observed along eastern slope edge.", 1),
        ("ZONE-CP-02", "NH-102 KM-42 Ridge Corridor", "Churachandpur", "Manipur", 24.345, 93.682, "HIGH", field_user_id, "Rohan Singh", 1, now, "In 15 minutes", "ACTIVE", "High transit bypass route vulnerable to debris flows.", 1),
        ("ZONE-TW-01", "Tawang Pass West Slope", "Tawang", "Arunachal Pradesh", 27.586, 91.859, "MODERATE", None, "", 3, "", "Scheduled at 08:00 tomorrow", "ACTIVE", "Steep granite slope prone to freeze-thaw slips.", 1),
        ("ZONE-EK-01", "East Khasi Hills Valley Escarpment", "East Khasi Hills", "Meghalaya", 25.578, 91.893, "HIGH", None, "", 2, "", "Scheduled at 10:00", "ACTIVE", "Very heavy continuous monsoon rain recorded.", 1),
        # Live monitoring zone registry
        ("ZONE-LIVE-01", "Churachandpur Central Hill Patrol", "Churachandpur", "Manipur", 24.332, 93.671, "MODERATE", field_user_id, "Rohan Singh", 2, now, "Active Live Shift", "ACTIVE", "Regular operational patrol route.", 0),
        ("ZONE-LIVE-02", "Tawang West Sela Pass Watch", "Tawang", "Arunachal Pradesh", 27.586, 91.859, "LOW", None, "", 4, now, "Next Check: 14:00", "ACTIVE", "Live seasonal monitoring baseline.", 0),
    ]
    cursor.executemany("""
        INSERT INTO monitoring_zones (id, name, district, state, lat, lon, risk_level, assigned_reporter_id, assigned_reporter_name, reporting_interval_hours, last_reported_at, next_report_due, status, vulnerability_notes, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, zones_data)

    # 3. Seed Demo Citizen Reports (is_demo = 1)
    citizen_reports = [
        ("CR-101", citizen_user_id, "Priya Sharma", "+91 98765 43213", "Near Hill School, Sector 4", "Churachandpur", 24.3315, 93.6720, "Ground crack", "Spotted fresh 3-inch fissures opening along the residential hill pathway following morning rain.", "", "HIGH", "VERIFIED", "Officer verified via field inspection; ground movement confirmed.", "Officer Ananya Sharma", 1, now, now),
        ("CR-102", citizen_user_id, "Priya Sharma", "+91 98765 43213", "Old Valley Road Bend", "Churachandpur", 24.3290, 93.6650, "Falling rocks", "Loose small rocks and gravel falling continuously across the foot bridge.", "", "MODERATE", "PENDING_REVIEW", "", "", 1, now, now),
    ]
    cursor.executemany("""
        INSERT INTO citizen_reports (id, user_id, citizen_name, phone, location, district, lat, lon, report_type, description, image_url, severity, status, officer_notes, verified_by, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, citizen_reports)

    # 4. Seed Demo Field Observations (is_demo = 1)
    sensor_readings = json.dumps({
        "rainfall_rate_mm_hr": 28.5,
        "soil_moisture_pct": 88.4,
        "tilt_deg": 4.2,
        "pore_pressure_kpa": 42.1
    })
    field_obs = [
        ("FO-201", field_user_id, "Rohan Singh", "ZONE-CP-01", "Churachandpur Sector 4 Slope Crest", "Churachandpur", 24.3325, 93.6715, "VISIBLE_CRACKS", sensor_readings, "Visual check confirms 12m tension crack propagating 4cm wider over 2 hours. Soil water saturation critical.", "", 1, "REVIEWED", "Forwarded to emergency rescue coordinator.", "SNR-2026-00482", 1, now),
        ("FO-202", field_user_id, "Rohan Singh", "ZONE-CP-02", "KM-42 Highway Cut", "Churachandpur", 24.3452, 93.6821, "BLOCKED_ROADS", sensor_readings, "Mud and loose aggregate spilling onto northbound lane. Traffic advised to detour.", "", 0, "SUBMITTED", "", "", 1, now),
    ]
    cursor.executemany("""
        INSERT INTO field_observations (id, reporter_id, reporter_name, zone_id, location, district, lat, lon, condition_category, sensor_readings, description, image_url, is_urgent, status, officer_notes, escalated_incident_id, is_demo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, field_obs)

    # 5. Seed Alerts (Demo = 1)
    alerts_data = [
        ("ALT-032", "Landslide Risk Escalation Alert", "CRITICAL", "Churachandpur Sector 4 & NH-102", "Churachandpur", "Heavy rainfall + 92% soil saturation + confirmed tension crack", 91, "PUBLISHED", 1, "Officer Ananya Sharma", "Sector 4, NH-102 KM-40 to KM-45", "Residents within 200m of eastern slope crest should prepare emergency kits and move to designated community shelters.", 1, now, now),
        ("ALT-031", "Rainfall Threshold Warning", "HIGH", "East Khasi Hills Escarpment", "East Khasi Hills", "Continuous precipitation exceeds 96mm / 24h threshold", 74, "PUBLISHED", 1, "Officer Ananya Sharma", "Mawkdok Dympep Valley corridors", "Exercise extreme caution on winding hillside roads; heavy transport halted.", 1, now, now),
        ("ALT-030", "Geotechnical Watch Notice (Internal)", "MODERATE", "Tawang West Pass", "Tawang", "Sub-surface creep detected on satellite InSAR", 58, "DRAFT", 0, "Officer Ananya Sharma", "Internal Defense Roads", "Officer advisory: schedule additional field reporter shift for tomorrow morning.", 1, now, now),
    ]
    cursor.executemany("""
        INSERT INTO alerts (id, title, level, location, district, cause, risk_score, status, is_public, published_by, target_areas, safety_instructions, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, alerts_data)

    # 6. Seed Central Incident (Demo = 1)
    timeline_events = [
        {"id": "t1", "time": "08:15", "label": "Detected", "detail": "Automated AI rainfall trigger exceeded 110mm threshold", "tone": "detected"},
        {"id": "t2", "time": "08:42", "label": "Reported", "detail": "Citizen report CR-101 submitted from Sector 4 pathway", "tone": "reported"},
        {"id": "t3", "time": "09:10", "label": "Verified", "detail": "Field reporter Rohan Singh confirmed tension crack FO-201", "tone": "verified"},
        {"id": "t4", "time": "09:30", "label": "Approved", "detail": "Officer approved multi-agency response mobilization", "tone": "approved"},
        {"id": "t5", "time": "09:45", "label": "Assigned", "detail": "NDRF Unit Alpha dispatched for clearance and evacuation cordon", "tone": "assigned"},
    ]
    resources = [
        {"id": "clearance", "name": "Heavy Road Clearance Unit", "recommended": 2, "available": 3, "assigned": 1, "unit": "units"},
        {"id": "evacuation", "name": "Search & Rescue Squad", "recommended": 2, "available": 4, "assigned": 2, "unit": "squads"},
        {"id": "medical", "name": "Mobile Triage Ambulance", "recommended": 1, "available": 2, "assigned": 1, "unit": "vehicles"},
    ]
    safe_routes = [
        {"id": "route-c", "name": "Corridor Charlie (Ridge Crest Bypass)", "status": "RECOMMENDED", "distance": "24.6 km", "travelTime": "45 min", "risk": "Low", "reason": "Clear ridge line, bypasses active KM-42 mudflow."},
        {"id": "route-b", "name": "Corridor Bravo (Valley Road)", "status": "HIGH RISK", "distance": "18.2 km", "travelTime": "Unavailable", "risk": "High", "reason": "Water pooling reported near old bridge."},
        {"id": "route-a", "name": "Highway NH-102", "status": "BLOCKED", "distance": "14.0 km", "travelTime": "Closed", "risk": "Extreme", "reason": "Active debris across both lanes at KM-42."},
    ]
    cursor.execute("""
        INSERT INTO incidents (id, title, location, district, lat, lon, severity, risk_score, priority_score, confidence, connectivity, last_signal, affected_area, officer_decision, decision_reason, response_status, source_type, source_id, timeline, resources, routes, verified_by, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        "SNR-2026-00482",
        "Churachandpur Slope Movement & Highway Threat",
        "Sector 4 Hillside & NH-102 KM-42",
        "Churachandpur",
        24.332,
        93.671,
        "CRITICAL",
        91,
        94,
        89,
        "LIMITED",
        "5 min ago",
        "14.2 km²",
        "APPROVED",
        "Immediate response needed to secure roadway and protect 18 hillside households.",
        "APPROVED FOR RESPONSE",
        "FIELD_OBSERVATION",
        "FO-201",
        json.dumps(timeline_events),
        json.dumps(resources),
        json.dumps(safe_routes),
        "Officer Ananya Sharma",
        1,
        now,
        now
    ))

    # 7. Seed Demo Rescue Task (Demo = 1)
    rescue_progress = [
        {
            "id": "p1",
            "time": "09:50",
            "status": "MOBILIZED",
            "notes": "Unit Alpha rolled out from base station with 2 rescue carriers and debris cutter gear.",
            "casualties": 0,
            "affected_people": 24,
            "road_status": "Blocked at KM-42.5",
            "photo_url": ""
        }
    ]
    cursor.execute("""
        INSERT INTO rescue_tasks (id, incident_id, alert_id, team_id, team_name, title, district, location, lat, lon, severity, hazard_details, safe_routes, instructions, assigned_by, status, progress_updates, casualties_count, affected_people_count, road_blocked, assistance_notes, is_demo, assigned_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        "TASK-084",
        "SNR-2026-00482",
        "ALT-032",
        rescue_user_id,
        "NDRF 12th Bn Unit Alpha",
        "Secure NH-102 KM-42 & Assist Sector 4 Evacuation",
        "Churachandpur",
        "NH-102 KM-42 & Sector 4 Ridge",
        24.332,
        93.671,
        "CRITICAL",
        "Slope displacement above Highway 102 with mud spillage. 18 households nearby on alert.",
        json.dumps(safe_routes),
        "Use Corridor Charlie for approach. Establish safety cordon at KM-42. Clear vehicle bottleneck. Coordinate with local ward head.",
        "Officer Ananya Sharma",
        "MOBILIZED",
        json.dumps(rescue_progress),
        0,
        24,
        1,
        "",
        1,
        now,
        now
    ))

    # 8. Seed Audit Logs (Demo = 1)
    cursor.execute("""
        INSERT INTO audit_logs (user_id, username, role, action, target_type, target_id, details, is_demo, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (1, "officer", "officer", "ALERT_PUBLISHED", "ALERT", "ALT-032", "Published Critical Public Warning for Churachandpur Sector 4", 1, now))

    conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully with Live & Demo separation at", DB_PATH)
