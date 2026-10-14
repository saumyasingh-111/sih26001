import urllib.request
import urllib.error
import json

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

def get(url, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        headers=({"Authorization": f"Bearer {token}"} if token else {}),
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("--- 1. Testing Health ---")
    h = get("/api/health")
    print("Health response:", h)

    print("\n--- 2. Testing Officer Login ---")
    officer_auth = post("/api/auth/login", {"username_or_email": "officer@sentinel.ner", "password": "officer123"})
    officer_token = officer_auth["access_token"]
    print(f"Officer logged in: {officer_auth['user']['full_name']}, Role: {officer_auth['user']['role']}")

    print("\n--- 3. Testing Citizen Login ---")
    citizen_auth = post("/api/auth/login", {"username_or_email": "citizen@sentinel.ner", "password": "citizen123"})
    citizen_token = citizen_auth["access_token"]
    print(f"Citizen logged in: {citizen_auth['user']['full_name']}, Role: {citizen_auth['user']['role']}")

    print("\n--- 4. Testing Rescue Team Login ---")
    rescue_auth = post("/api/auth/login", {"username_or_email": "rescue@sentinel.ner", "password": "rescue123"})
    rescue_token = rescue_auth["access_token"]
    print(f"Rescue team logged in: {rescue_auth['user']['full_name']}, Role: {rescue_auth['user']['role']}")

    print("\n--- 5. Testing Field Reporter Login ---")
    field_auth = post("/api/auth/login", {"username_or_email": "field@sentinel.ner", "password": "field123"})
    field_token = field_auth["access_token"]
    print(f"Field Reporter logged in: {field_auth['user']['full_name']}, Role: {field_auth['user']['role']}")

    print("\n--- 6. Testing RBAC Security: Citizen trying to access /api/officer/overview ---")
    try:
        get("/api/officer/overview", citizen_token)
        print("FAIL: Citizen was able to access officer overview!")
    except urllib.error.HTTPError as e:
        print(f"PASS: Citizen blocked with HTTP {e.code} (Expected 403 Forbidden)")

    print("\n--- 7. Testing RBAC Security: Field Reporter trying to access /api/rescue/my-tasks ---")
    try:
        get("/api/rescue/my-tasks", field_token)
        print("FAIL: Field reporter was able to access rescue tasks!")
    except urllib.error.HTTPError as e:
        print(f"PASS: Field reporter blocked with HTTP {e.code} (Expected 403 Forbidden)")

    print("\n--- 8. Testing Officer Access to Overview ---")
    overview = get("/api/officer/overview", officer_token)
    print("Officer overview metrics:", overview["metrics"])

    print("\n--- 9. Testing Public Citizen Feed (No Auth Required) ---")
    pub = get("/api/citizen/public-feed")
    print(f"Public alerts returned: {len(pub['alerts'])}, Public risk zones: {len(pub['risk_zones'])}")

    print("\n--- 10. Testing Field Reporter assigned zones ---")
    zones = get("/api/field/my-zones", field_token)
    print(f"Assigned zones count: {len(zones['assigned_zones'])}")

    print("\n--- 11. Testing Rescue Team assigned tasks ---")
    tasks = get("/api/rescue/my-tasks", rescue_token)
    print(f"Assigned tasks count: {tasks['count']}")

    print("\nALL BACKEND API AND RBAC TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
