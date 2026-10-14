from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
from backend.database import get_db, verify_password, hash_password, log_action
from backend.auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    district: Optional[str] = "Churachandpur"
    phone: Optional[str] = ""

@router.post("/login")
def login(payload: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, password_hash, full_name, role, district, phone, badge_or_unit
        FROM users
        WHERE username = ? OR email = ?;
    """, (payload.username_or_email, payload.username_or_email))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
        )

    token = create_access_token({
        "sub": str(user["id"]),
        "username": user["username"],
        "role": user["role"],
    })

    log_action(user["id"], user["username"], user["role"], "USER_LOGIN", "USER", str(user["id"]), f"User {user['username']} logged in successfully")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "district": user["district"],
            "phone": user["phone"],
            "badge_or_unit": user["badge_or_unit"],
        }
    }

@router.post("/register")
def register(payload: RegisterRequest):
    conn = get_db()
    cursor = conn.cursor()

    # Check existing
    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (payload.username, payload.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with that username or email already exists.",
        )

    now = datetime.now(timezone.utc).isoformat()
    # Default registered role is citizen
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, full_name, role, district, phone, badge_or_unit, created_at)
        VALUES (?, ?, ?, ?, 'citizen', ?, ?, '', ?);
    """, (payload.username, payload.email, hash_password(payload.password), payload.full_name, payload.district or "Churachandpur", payload.phone or "", now))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    token = create_access_token({"sub": str(new_id), "username": payload.username, "role": "citizen"})
    log_action(new_id, payload.username, "citizen", "USER_REGISTER", "USER", str(new_id), "New citizen account registered")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_id,
            "username": payload.username,
            "email": payload.email,
            "full_name": payload.full_name,
            "role": "citizen",
            "district": payload.district or "Churachandpur",
            "phone": payload.phone or "",
            "badge_or_unit": "",
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}
