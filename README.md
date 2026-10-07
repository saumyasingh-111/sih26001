# SENTINEL NER

**AI-Powered Landslide Intelligence & Early Warning Platform**

SENTINEL NER is a SIH26001 demonstration platform for monitoring, explaining and responding to landslide risk across India's North Eastern Region. It combines simulated rainfall, soil, terrain, satellite and field evidence into a calm operational view for district and field teams.

## What is implemented

- Premium landing page with animated geospatial risk overview
- Command Center with regional risk map, alert queue, trajectory chart and explainable risk panel
- Risk Intelligence view with forecast outlook, confidence and weighted decision factors
- Offline-ready Field Reports workflow with sync queue and simulated CV detections
- Responsive layout for desktop and field mobile use
- Demo Mode with clearly labeled simulated data for NER regions
- FastAPI mock service layer for risk, alerts, incidents, CV analysis and synchronization

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

The optional API layer can be run separately:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload --port 8000
```

## API surface

The demo API exposes:

- `GET /api/health`
- `GET /api/risk/current`
- `GET /api/risk/history`
- `GET /api/risk/prediction`
- `POST /api/cv/analyze`
- `GET /api/alerts`
- `POST /api/incidents`
- `POST /api/sync`

All responses are explicitly marked `simulated`. No paid data provider, government feed, satellite provider or trained ML model is presented as live. The frontend is intentionally usable without the API so a hackathon demo works immediately.

## Architecture and next steps

The frontend currently uses a local demo data layer for deterministic presentation. The FastAPI routes are the replacement boundary for real services: weather and environmental ingestion, PostGIS-backed locations, authenticated role-based users, a PyTorch/YOLO CV service, satellite change detection and notification adapters.

For production, add JWT authentication, PostgreSQL/PostGIS, object storage for evidence, file validation and size limits, audit logs, IndexedDB-backed report queues, real offline sync conflict handling, and field verification before issuing public warnings.

## Important prototype boundary

Risk scores, environmental values, map layers, CV detections and alerts are simulated demonstration data. They are not scientifically validated forecasts and must not be used for operational evacuation decisions.