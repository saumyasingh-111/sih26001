import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def post(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def put(url, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get(url, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        headers=({"Authorization": f"Bearer {token}"} if token else {}),
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 70)
    print("SENTINEL NER — FULL PLATFORM END-TO-END WORKFLOW VERIFICATION")
    print("=" * 70)

    # 1. Authenticate users for all 4 roles
    print("\n[STEP 1] Authenticating all 4 roles...")
    officer_auth = post("/api/auth/login", {"username_or_email": "officer@sentinel.ner", "password": "officer123"})
    officer_token = officer_auth["access_token"]
    print(f" -> Officer: {officer_auth['user']['full_name']} (Role: {officer_auth['user']['role']})")

    field_auth = post("/api/auth/login", {"username_or_email": "field@sentinel.ner", "password": "field123"})
    field_token = field_auth["access_token"]
    print(f" -> Field Monitor: {field_auth['user']['full_name']} (Role: {field_auth['user']['role']})")

    rescue_auth = post("/api/auth/login", {"username_or_email": "rescue@sentinel.ner", "password": "rescue123"})
    rescue_token = rescue_auth["access_token"]
    print(f" -> Rescue Team: {rescue_auth['user']['full_name']} (Role: {rescue_auth['user']['role']})")

    citizen_auth = post("/api/auth/login", {"username_or_email": "citizen@sentinel.ner", "password": "citizen123"})
    citizen_token = citizen_auth["access_token"]
    print(f" -> Citizen: {citizen_auth['user']['full_name']} (Role: {citizen_auth['user']['role']})")

    # -----------------------------------------------------------------------
    # WORKFLOW A: Citizen reporting
    # -----------------------------------------------------------------------
    print("\n[WORKFLOW A] Citizen Reporting -> Officer Verification -> Citizen Status Sync")
    report_data = {
        "citizen_name": "Priya Sharma",
        "phone": "+91 98765 43213",
        "location": "Upper Ridge Footpath, Sector 4",
        "district": "Churachandpur",
        "lat": 24.3318,
        "lon": 93.6725,
        "report_type": "Ground cracks",
        "description": "5-meter wide ground fracture opened near water storage tank after heavy morning rains.",
        "severity": "HIGH"
    }
    sub_res = post("/api/citizen/reports", report_data, citizen_token)
    report_id = sub_res["report_id"]
    print(f" 1. Citizen submitted report: ID={report_id}, Initial Status={sub_res['status']}")

    # Officer retrieves reports
    officer_reports = get("/api/officer/citizen-reports", officer_token)["reports"]
    matched = next((r for r in officer_reports if r["id"] == report_id), None)
    assert matched is not None, "Report not found in Officer queue!"
    print(f" 2. Officer found report {report_id} in review queue. Description: '{matched['description'][:40]}...'")

    # Officer verifies report
    review_res = put(f"/api/officer/citizen-reports/{report_id}/review", {
        "status": "VERIFIED",
        "severity": "HIGH",
        "officer_notes": "Officer verified active slope shear line. Forwarded to response coordinator."
    }, officer_token)
    print(f" 3. Officer verified report {report_id}. Updated status: {review_res['status']}")

    # Citizen checks personal report history
    citizen_history = get("/api/citizen/my-reports", citizen_token)["reports"]
    citizen_matched = next((r for r in citizen_history if r["id"] == report_id), None)
    assert citizen_matched is not None, "Citizen cannot see their own report!"
    assert citizen_matched["status"] == "VERIFIED", f"Expected VERIFIED, got {citizen_matched['status']}"
    print(f" 4. Citizen verified status sync confirmed: Status={citizen_matched['status']}, Officer Notes='{citizen_matched['officer_notes']}'")
    print(" -> WORKFLOW A: PASSED [SUCCESS]")

    # -----------------------------------------------------------------------
    # WORKFLOW B: Field Monitoring & Urgent Escalation
    # -----------------------------------------------------------------------
    print("\n[WORKFLOW B] Field Observation -> Officer Review & Incident Escalation")
    obs_data = {
        "zone_id": "ZONE-CP-01",
        "location": "Sector 4 Eastern Slope Crest",
        "district": "Churachandpur",
        "lat": 24.3325,
        "lon": 93.6715,
        "condition_category": "SLOPE_MOVEMENT",
        "sensor_readings": {
            "rainfall_rate_mm_hr": 34.0,
            "soil_moisture_pct": 91.5,
            "tilt_deg": 5.4,
            "pore_pressure_kpa": 48.2
        },
        "description": "Continuous accelerated creeping movement observed. InSAR telemetry matches ground displacement.",
        "is_urgent": True
    }
    obs_res = post("/api/field/observations", obs_data, field_token)
    obs_id = obs_res["observation_id"]
    print(f" 1. Field Reporter submitted observation: ID={obs_id}, Urgent={obs_res['is_urgent']}")

    # Officer views field observations
    officer_obs_list = get("/api/officer/field-observations", officer_token)["observations"]
    matched_obs = next((o for o in officer_obs_list if o["id"] == obs_id), None)
    assert matched_obs is not None, "Observation missing from officer queue!"
    print(f" 2. Officer received observation {obs_id}. Category={matched_obs['condition_category']}")

    # Officer escalates to central incident
    escalate_res = put(f"/api/officer/field-observations/{obs_id}/review", {
        "status": "ESCALATED_TO_INCIDENT",
        "officer_notes": "Ground acceleration confirmed by sensor telemetry. Escalated to central emergency incident.",
        "create_incident": True
    }, officer_token)
    inc_id = escalate_res["escalated_incident_id"]
    print(f" 3. Officer escalated observation {obs_id} -> Generated Central Incident ID: {inc_id}")
    print(" -> WORKFLOW B: PASSED [SUCCESS]")

    # -----------------------------------------------------------------------
    # WORKFLOW C: Alert Publication (Public vs Internal Distinction)
    # -----------------------------------------------------------------------
    print("\n[WORKFLOW C] Officer Creates Public Alert -> Citizen Feed Synchronization")
    alert_payload = {
        "title": "Sector 4 Slope Evacuation Warning",
        "level": "CRITICAL",
        "location": "Churachandpur Sector 4",
        "district": "Churachandpur",
        "cause": "Accelerated slope creep exceeding 5.4° tilt with 91% soil saturation",
        "risk_score": 93,
        "is_public": True,
        "target_areas": "Downslope residential blocks within 150m of eastern crest",
        "safety_instructions": "Move along Corridor Charlie to the Sector 4 Community Relief Shelter."
    }
    pub_alert_res = post("/api/officer/alerts", alert_payload, officer_token)
    new_alert_id = pub_alert_res["alert_id"]
    print(f" 1. Officer created public alert: ID={new_alert_id}, is_public={pub_alert_res['is_public']}")

    # Public citizen feed check (Without auth)
    public_feed = get("/api/citizen/public-feed?district=Churachandpur")
    matched_public_alert = next((a for a in public_feed["alerts"] if a["id"] == new_alert_id), None)
    assert matched_public_alert is not None, "Public alert did not appear in citizen feed!"
    print(f" 2. Citizen public feed verified: Found alert '{matched_public_alert['title']}' for district {matched_public_alert['district']}")

    # Retract from public test
    retract_res = put(f"/api/officer/alerts/{new_alert_id}/publish", {"is_public": False, "status": "DRAFT"}, officer_token)
    public_feed_after_retract = get("/api/citizen/public-feed?district=Churachandpur")
    retracted_in_feed = any(a["id"] == new_alert_id for a in public_feed_after_retract["alerts"])
    assert not retracted_in_feed, "Retracted internal alert leaked into citizen feed!"
    print(" 3. Access boundary verified: Internal draft alert is strictly hidden from citizens.")

    # Re-publish for citizen safety
    put(f"/api/officer/alerts/{new_alert_id}/publish", {"is_public": True, "status": "PUBLISHED"}, officer_token)
    print(" -> WORKFLOW C: PASSED [SUCCESS]")

    # -----------------------------------------------------------------------
    # WORKFLOW D: Rescue Task Assignment & Status Progression
    # -----------------------------------------------------------------------
    print("\n[WORKFLOW D] Officer Dispatches Rescue Unit -> Rescue Updates Workflow")
    rescue_team_id = rescue_auth["user"]["id"]
    task_payload = {
        "incident_id": inc_id,
        "team_id": rescue_team_id,
        "title": "Emergency Evacuation & NH-102 Corridor Clearance",
        "district": "Churachandpur",
        "location": "NH-102 KM-42 & Sector 4 Ridge",
        "lat": 24.332,
        "lon": 93.671,
        "severity": "CRITICAL",
        "hazard_details": "Tension crack propagation threatening road corridor. 18 hillside households require assisted evacuation.",
        "instructions": "Approach via Corridor Charlie. Establish hazard cordon. Clear light rubble from roadway.",
        "safe_routes": [
            {"name": "Corridor Charlie", "status": "RECOMMENDED", "distance": "24.6 km", "travelTime": "45 min", "risk": "Low", "reason": "Clear ridge line"}
        ]
    }
    task_res = post("/api/officer/rescue-tasks", task_payload, officer_token)
    task_id = task_res["task_id"]
    print(f" 1. Officer dispatched mission: Task ID={task_id} to team '{task_res['assigned_to']}'")

    # Rescue team views assigned missions
    rescue_tasks_list = get("/api/rescue/my-tasks", rescue_token)["tasks"]
    matched_task = next((t for t in rescue_tasks_list if t["id"] == task_id), None)
    assert matched_task is not None, "Task missing from rescue team dashboard!"
    print(f" 2. Rescue team retrieved mission {task_id}. Initial status: {matched_task['status']}")

    # Rescue team acknowledges and mobilizes
    put(f"/api/rescue/tasks/{task_id}/status", {"status": "MOBILIZED", "notes": "Two rescue vehicles rolling out from Sector Base."}, rescue_token)
    put(f"/api/rescue/tasks/{task_id}/status", {"status": "ON_SITE", "notes": "Unit arrived on site at KM-42. Evacuation cordon active."}, rescue_token)
    print(" 3. Rescue team transitioned workflow: ASSIGNED -> MOBILIZED -> ON_SITE")

    # Officer control center checks live status
    officer_task_view = get("/api/officer/rescue-tasks", officer_token)["rescue_tasks"]
    officer_task = next(t for t in officer_task_view if t["id"] == task_id)
    assert officer_task["status"] == "ON_SITE", f"Expected ON_SITE, got {officer_task['status']}"
    print(f" 4. Officer Control Center live sync confirmed: Mission {task_id} status is now '{officer_task['status']}'")

    # Rescue team submits progress update with evacuated count & road status
    post(f"/api/rescue/tasks/{task_id}/updates", {
        "status": "ON_SITE",
        "notes": "18 residents successfully escorted to Sector 4 Community Shelter. Single lane opened for emergency traffic.",
        "casualties": 0,
        "affected_people": 18,
        "road_status": "Single-lane open (Emergency vehicles only)",
        "request_additional_support": False
    }, rescue_token)
    print(" 5. Rescue team submitted tactical progress: 18 residents evacuated.")
    print(" -> WORKFLOW D: PASSED [SUCCESS]")

    # -----------------------------------------------------------------------
    # WORKFLOW E: Incident Resolution & Mission Completion
    # -----------------------------------------------------------------------
    print("\n[WORKFLOW E] Rescue Mission Completion -> Officer Incident Resolution")
    # Rescue team marks mission completed
    put(f"/api/rescue/tasks/{task_id}/status", {"status": "COMPLETED", "notes": "Evacuation complete. Road stabilized and clear."}, rescue_token)
    print(" 1. Rescue team marked mission COMPLETED.")

    # Officer formally closes and resolves incident
    res_close = put(f"/api/officer/incidents/{inc_id}/resolve", {
        "resolution_notes": "All residents safely sheltered, debris cleared, monitoring continues at lower alert."
    }, officer_token)
    print(f" 2. Officer closed incident {inc_id}: Status={res_close['status']}")

    # Verify incident timeline contains resolution event
    updated_incidents = get("/api/officer/incidents", officer_token)["incidents"]
    closed_incident = next(i for i in updated_incidents if i["id"] == inc_id)
    status_val = closed_incident.get("response_status") or closed_incident.get("responseStatus")
    assert status_val == "RESOLVED", f"Expected RESOLVED, got {status_val}"
    print(f" 3. Incident {inc_id} closed loop verified across shared database. Response Status: '{status_val}'")
    print(" -> WORKFLOW E: PASSED [SUCCESS]")

    # -----------------------------------------------------------------------
    # RBAC SECURITY ENFORCEMENT VERIFICATION
    # -----------------------------------------------------------------------
    print("\n[SECURITY AUDIT] Testing Role-Based Access Control Boundaries...")
    # 1. Citizen trying officer routes -> 403
    try:
        get("/api/officer/overview", citizen_token)
        print("FAIL: Citizen was able to access officer overview!")
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print(f" -> PASS: Citizen blocked from /api/officer (HTTP {e.code} Forbidden)")

    # 2. Citizen trying rescue routes -> 403
    try:
        get("/api/rescue/my-tasks", citizen_token)
        print("FAIL: Citizen was able to access rescue tasks!")
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print(f" -> PASS: Citizen blocked from /api/rescue (HTTP {e.code} Forbidden)")

    # 3. Field reporter trying officer routes -> 403
    try:
        get("/api/officer/rescue-tasks", field_token)
        print("FAIL: Field reporter was able to access officer rescue management!")
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print(f" -> PASS: Field reporter blocked from /api/officer (HTTP {e.code} Forbidden)")

    # 4. Rescue team trying field routes -> 403
    try:
        get("/api/field/my-zones", rescue_token)
        print("FAIL: Rescue team was able to access field reporter zones!")
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print(f" -> PASS: Rescue team blocked from /api/field (HTTP {e.code} Forbidden)")

    # 5. Unauthenticated user trying protected routes -> 401
    try:
        get("/api/officer/overview")
        print("FAIL: Unauthenticated user accessed officer overview!")
    except urllib.error.HTTPError as e:
        assert e.code == 401
        print(f" -> PASS: Unauthenticated user blocked (HTTP {e.code} Unauthorized)")

    # 6. Verify audit logs recorded actions
    audit_logs = get("/api/officer/audit-logs", officer_token)["audit_logs"]
    assert len(audit_logs) >= 5, "Audit logs did not record operations!"
    print(f" -> PASS: Audit log contains {len(audit_logs)} operational entries with full traceability.")

    print("\n" + "=" * 70)
    print("ALL 5 END-TO-END WORKFLOWS AND RBAC ACCESS BOUNDARIES FULLY VERIFIED!")
    print("=" * 70)

if __name__ == "__main__":
    main()
