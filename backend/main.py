from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SENTINEL NER Demo API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REGION = {
    "name": "Churachandpur",
    "state": "Manipur",
    "risk": 91,
    "status": "CRITICAL",
    "simulated": True,
    "updated_at": datetime.now(timezone.utc).isoformat(),
}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "operational", "mode": "demo"}


@app.get("/api/risk/current")
def current_risk() -> dict[str, Any]:
    return {"regions": [REGION], "simulated": True}


@app.get("/api/risk/history")
def risk_history() -> dict[str, Any]:
    return {"region": REGION["name"], "values": [25, 28, 34, 45, 58, 69, 79, 91], "simulated": True}


@app.get("/api/risk/prediction")
def risk_prediction() -> dict[str, Any]:
    return {
        "current": 91,
        "forecast": [{"horizon": "2h", "risk": 94}, {"horizon": "6h", "risk": 88}, {"horizon": "24h", "risk": 63}],
        "confidence": 86,
        "factors": {"rainfall_anomaly": 32, "soil_saturation": 18, "slope_vulnerability": 15, "historical_frequency": 12, "visual_evidence": 10},
        "simulated": True,
    }


@app.post("/api/cv/analyze")
async def analyze_image(file: UploadFile = File(...)) -> dict[str, Any]:
    return {
        "filename": file.filename,
        "simulated": True,
        "detections": [
            {"label": "Ground crack", "confidence": 0.93, "severity": "high"},
            {"label": "Debris", "confidence": 0.89, "severity": "moderate"},
            {"label": "Road blockage", "confidence": 0.96, "severity": "critical"},
        ],
        "assessment": "Multiple indicators of slope instability detected. Combined visual evidence suggests elevated landslide risk.",
    }


@app.get("/api/alerts")
def alerts() -> dict[str, Any]:
    return {"alerts": [{"id": "ALT-032", "level": "critical", "title": "Risk escalation detected", "location": REGION["name"], "risk": 91}], "simulated": True}


@app.post("/api/incidents")
def create_incident(payload: dict[str, Any]) -> dict[str, Any]:
    return {"id": "INC-DEMO-032", "status": "pending", "received_at": datetime.now(timezone.utc).isoformat(), "payload": payload, "simulated": True}


@app.post("/api/sync")
def sync_reports() -> dict[str, Any]:
    return {"status": "synchronized", "synced_count": 3, "simulated": True}