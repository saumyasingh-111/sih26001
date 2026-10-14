import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

def post(url, data, token=None, mode="live"):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Sentinel-Mode": mode,
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get(url, token=None, mode="live"):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        headers={
            "X-Sentinel-Mode": mode,
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_isolation():
    print("Testing Live vs Demo Mode Isolation...")

    # Log in as officer
    officer_auth = post("/api/auth/login", {"username_or_email": "officer@sentinel.ner", "password": "officer123"})
    officer_token = officer_auth["access_token"]

    # 1. Create a DEMO alert
    demo_alert = post("/api/officer/alerts", {
        "title": "DEMO SIMULATION: Flash Flood in Test Basin",
        "level": "CRITICAL",
        "location": "Test Basin A",
        "district": "Churachandpur",
        "cause": "Simulation Exercise",
        "risk_score": 95,
        "is_public": True,
        "target_areas": "Test Sector 1",
        "safety_instructions": "This is a drill."
    }, token=officer_token, mode="demo")
    demo_alert_id = demo_alert["alert_id"]
    print(f" -> Created Demo Alert: {demo_alert_id}")

    # 2. Check Live Alerts - MUST NOT contain the demo alert!
    live_alerts = get("/api/officer/alerts", token=officer_token, mode="live")
    live_ids = [a["id"] for a in live_alerts["alerts"]]
    assert demo_alert_id not in live_ids, f"ERROR: Demo alert {demo_alert_id} found in live alerts!"
    print(f" -> Verified: Demo alert {demo_alert_id} is NOT present in Live mode alerts ({len(live_ids)} live alerts).")

    # 3. Check Demo Alerts - MUST contain the demo alert!
    demo_alerts = get("/api/officer/alerts", token=officer_token, mode="demo")
    demo_ids = [a["id"] for a in demo_alerts["alerts"]]
    assert demo_alert_id in demo_ids, f"ERROR: Demo alert {demo_alert_id} not found in demo alerts!"
    print(f" -> Verified: Demo alert {demo_alert_id} is present in Demo mode alerts ({len(demo_ids)} demo alerts).")

    # 4. Check Citizen Public Feed in Live mode vs Demo mode
    citizen_live_feed = get("/api/citizen/public-feed", mode="live")
    live_feed_ids = [a["id"] for a in citizen_live_feed["alerts"]]
    assert demo_alert_id not in live_feed_ids, "ERROR: Demo alert leaked to Live Citizen Feed!"
    print(f" -> Verified: Citizen Public Feed in Live mode does NOT contain demo alert.")

    citizen_demo_feed = get("/api/citizen/public-feed", mode="demo")
    demo_feed_ids = [a["id"] for a in citizen_demo_feed["alerts"]]
    assert demo_alert_id in demo_feed_ids, "ERROR: Demo alert not present in Demo Citizen Feed!"
    print(f" -> Verified: Citizen Public Feed in Demo mode contains the simulated alert.")

    # 5. Submit Citizen Report in Demo mode
    demo_report = post("/api/citizen/reports", {
        "citizen_name": "Demo Tester",
        "phone": "9999999999",
        "location": "Demo Sector B",
        "district": "Churachandpur",
        "lat": 24.33,
        "lon": 93.67,
        "report_type": "Ground cracks",
        "description": "Simulated crack for testing.",
        "severity": "MODERATE"
    }, mode="demo")
    demo_report_id = demo_report["report_id"]
    print(f" -> Submitted Demo Citizen Report: {demo_report_id}")

    # Check Officer Citizen Queue in Live mode vs Demo mode
    officer_live_reports = get("/api/officer/citizen-reports", token=officer_token, mode="live")
    live_rep_ids = [r["id"] for r in officer_live_reports["reports"]]
    assert demo_report_id not in live_rep_ids, "ERROR: Demo report leaked into Live officer queue!"
    print(f" -> Verified: Demo citizen report NOT in live officer queue.")

    officer_demo_reports = get("/api/officer/citizen-reports", token=officer_token, mode="demo")
    demo_rep_ids = [r["id"] for r in officer_demo_reports["reports"]]
    assert demo_report_id in demo_rep_ids, "ERROR: Demo report not in demo officer queue!"
    print(f" -> Verified: Demo citizen report IS in demo officer queue.")

    print("\nALL LIVE VS DEMO DATA ISOLATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_isolation()
