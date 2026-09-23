"""Shared FastAPI dependencies for the AEGIS backend."""

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from backend.config import BackendConfig
from backend.security import decode_access_token

http_bearer = HTTPBearer()
_config: BackendConfig | None = None


def get_config() -> BackendConfig:
    global _config
    if _config is None:
        _config = BackendConfig.from_env()
    return _config


def get_db() -> Generator[Session, None, None]:
    from backend.database import SessionLocal  # import at call time; SessionLocal is set during init_db()
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
    config: BackendConfig = Depends(get_config),
):
    """Decode JWT and return the User ORM object, or raise 401."""
    from backend.models import User  # avoid circular import
    
    token = credentials.credentials
    try:
        payload = decode_access_token(token, config)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.status == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return user


def require_admin(
    current_user = Depends(get_current_user),
):
    """Raise 403 if the current user is not an admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
