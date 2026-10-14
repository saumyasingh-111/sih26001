import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import HTTPException, Security, Depends, status, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import get_db

SECRET_KEY = os.environ.get("SENTINEL_JWT_SECRET", "sentinel_ner_super_secret_jwt_key_2026_disaster_platform")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, full_name, role, district, phone, badge_or_unit FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "district": row["district"],
        "phone": row["phone"],
        "badge_or_unit": row["badge_or_unit"],
    }

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, full_name, role, district, phone, badge_or_unit FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "full_name": row["full_name"],
            "role": row["role"],
            "district": row["district"],
            "phone": row["phone"],
            "badge_or_unit": row["badge_or_unit"],
        }
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user_role}' is not authorized for this resource. Required role(s): {', '.join(allowed_roles)}.",
            )
        return current_user
    return role_checker

def get_data_mode(
    x_sentinel_mode: Optional[str] = Header(None, alias="X-Sentinel-Mode"),
    mode: Optional[str] = Query(None)
) -> int:
    """
    Returns 1 for DEMO mode and 0 for LIVE mode.
    Reads from header X-Sentinel-Mode or query param ?mode=.
    Defaults to 0 (Live).
    """
    val = (mode or x_sentinel_mode or "live").strip().lower()
    return 1 if val == "demo" else 0

