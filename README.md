# SENTINEL NER

**Role-Based Multi-Interface Disaster Management & Early Warning Platform**

SENTINEL NER is an integrated, role-protected disaster management platform designed for monitoring, verifying, and responding to landslide hazards across India's North Eastern Region (NER).

The platform divides operations into **four genuinely separate, role-protected interfaces**, each tailored to a specific user group while remaining connected to a single shared backend, SQLite database, and disaster intelligence engine.

---

## 1. The Four Role-Protected Interfaces

### 1. Citizen Portal — `/citizen`
- **Audience:** Residents, commuters, and travelers in landslide-prone areas.
- **Key Features:**
  - Public risk status, live weather telemetry, and rainfall anomalies for monitored districts.
  - Interactive Public Map displaying verified landslide risk zones and official designated shelters.
  - Location-specific safety warnings and official evacuation guidance.
  - Warning Signs Report Form for citizens to submit observations of ground cracks, rockfalls, unusual water flow, and slope movement.
  - Personal report history with real-time officer verification updates for authenticated citizens.
- **Security Boundary:** Zero officer controls, no internal field assignments, no rescue deployment details, and no private data belonging to other citizens are exposed.

### 2. Field Reporter Portal — `/field`
- **Audience:** Authorized ground-level field monitors.
- **Key Features:**
  - Assigned monitoring zones with configurable reporting schedules (e.g., every 1–2 hours).
  - Geotagged observation form with GPS auto-detection, photo upload, and condition category classification (`STABLE`, `INCREASED_RISK`, `VISIBLE_CRACKS`, `SLOPE_MOVEMENT`, `FALLING_ROCKS`, `BLOCKED_ROADS`, `SUSPECTED_LANDSLIDE`).
  - Geotechnical sensor readings integration (rainfall rate, soil moisture %, tilt angle, pore water pressure).
  - Urgent Incident Escalation button that bypasses scheduled intervals to notify the Officer Control Center immediately.
  - Offline draft queue with automatic synchronization when connectivity returns.
- **Security Boundary:** Restricted exclusively to `field_reporter` (and `officer`). No administrative privileges, no access to rescue deployments.

### 3. Officer Control Center — `/officer`
- **Audience:** Authorized disaster management officers and district control leads.
- **Key Features:**
  - Regional GIS Workstation with multi-layer overlays (slope, rainfall, satellite imagery, historical landslides, blackout telemetry).
  - AI Risk Intelligence Workspace explaining weighted decision factors and forecast outlooks.
  - Incident Verification Queue clearly distinguishing between:
    1. AI-predicted risk
    2. Unverified citizen reports
    3. Unverified field observations
    4. Officer-verified incidents
    5. Active response operations
    6. Resolved incidents
  - Alert Management: Create, review, approve, and publish alerts to public citizens or internal HQ.
  - Field Reporter Management: Assign monitors to high-risk zones and configure reporting intervals.
  - Rescue Coordination: Dispatch missions, monitor unit mobilization, and track tactical progress.
  - Complete immutable audit trail.
- **Security Boundary:** Accessible strictly by authorized `officer` accounts.

### 4. Rescue Operations Portal — `/rescue`
- **Audience:** Emergency response teams (NDRF / SDRF / Quick Response Units).
- **Key Features:**
  - Dedicated dispatch dashboard with incident severity, exact coordinates, and officer directives.
  - Tactical Safe Route Intelligence identifying clear corridors (e.g. Corridor Charlie) versus blocked highways.
  - Sequential Response Workflow progression:
    `ASSIGNED` → `ACKNOWLEDGED` → `MOBILIZED` → `ON_SITE` → `ASSISTANCE_REQUIRED` → `COMPLETED`
  - Real-time tactical status sync with the Officer Control Center.
  - Progress updates with casualty tracking, evacuated count, road clearance state, and additional support requests.
  - Completed mission history register.
- **Security Boundary:** Rescue teams see only their assigned missions. Sensitive deployment positions are never exposed on the public citizen portal.

---

## 2. Shared Backend Architecture & RBAC

The system follows an integrated single-source-of-truth pipeline:

```
Environmental Sensors & Telemetry
            ↓
  Risk Intelligence Engine
            ↓
  Shared FastAPI Backend & SQLite Database (`sentinel.db`)
            ↓
  Four Role-Specific Portals:
  ┌────────────┬────────────────┬──────────────┬──────────────┐
  │  Citizen   │ Field Reporter │   Officer    │ Rescue Team  │
  │ (/citizen) │    (/field)    │  (/officer)  │   (/rescue)  │
  └────────────┴────────────────┴──────────────┴──────────────┘
```

- **Backend:** FastAPI with SQLite relational database (`backend/sentinel.db`).
- **Authentication:** JWT (JSON Web Tokens) with server-side role verification on every protected endpoint.
- **Security:** Unauthorized requests are blocked at both client-side route guards and server-side HTTP 403 Forbidden checks.

---

## 3. Pre-Seeded Demonstration Accounts

For seamless evaluation, pre-configured accounts are provided for all four roles:

| Role | Username / Email | Password | Intended Portal |
| :--- | :--- | :--- | :--- |
| **Officer** | `officer@sentinel.ner` | `officer123` | `/officer` |
| **Field Reporter** | `field@sentinel.ner` | `field123` | `/field` |
| **Rescue Team** | `rescue@sentinel.ner` | `rescue123` | `/rescue` |
| **Citizen** | `citizen@sentinel.ner` | `citizen123` | `/citizen` |

*New citizens can also register directly on the Login page.*

---

## 4. End-to-End Operational Workflows

The platform supports 5 closed-loop workflows verified via automated testing:

- **Workflow A (Citizen Reporting):** Citizen submits warning observation → Stored in shared database → Officer reviews and marks `VERIFIED` → Citizen portal displays officer verification note.
- **Workflow B (Field Monitoring):** Field monitor submits scheduled observation + sensor telemetry → Officer assesses in queue → Officer escalates to central incident.
- **Workflow C (Alert Publication):** High risk identified → Officer drafts and publishes alert with `is_public=true` → Citizen portal displays live bulletin.
- **Workflow D (Rescue Assignment):** Officer assigns incident to NDRF Unit Alpha → Rescue team receives mission → Advances workflow (`ASSIGNED` → `MOBILIZED` → `ON_SITE`) → Officer dashboard reflects live status.
- **Workflow E (Incident Resolution):** Rescue team completes mission and logs evacuated count → Officer reviews and resolves incident → Closed loop recorded in audit trail.

---

## 5. Running the Application

### 1. Start the FastAPI Backend
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.main:app --port 8000 --reload
```

### 2. Start the Frontend Dev Server
```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

### 3. Run Automated Workflow & RBAC Tests
```powershell
.\.venv\Scripts\python.exe test_full_platform_e2e.py
```