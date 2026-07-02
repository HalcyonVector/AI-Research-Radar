"""Bearer-token auth for internal/admin endpoints (spec 4.3)."""
from fastapi import Header, HTTPException, status
from src.config import settings


def require_admin(authorization: str | None = Header(default=None)) -> None:
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if token != settings.secret_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing admin token")
