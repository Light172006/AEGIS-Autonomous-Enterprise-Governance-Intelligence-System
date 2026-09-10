"""JWT token creation/verification and password hashing.

Uses bcrypt directly instead of passlib to avoid the passlib/bcrypt>=4.1
incompatibility (passlib's internal bug detection sends a >72-byte test
password which newer bcrypt correctly rejects).
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from backend.config import BackendConfig


def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(
    user_id: str,
    role: str,
    config: BackendConfig | None = None,
) -> str:
    cfg = config or BackendConfig.from_env()
    expire = datetime.now(timezone.utc) + timedelta(minutes=cfg.jwt_expire_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, cfg.jwt_secret, algorithm=cfg.jwt_algorithm)


def decode_access_token(token: str, config: BackendConfig | None = None) -> dict[str, Any]:
    cfg = config or BackendConfig.from_env()
    return jwt.decode(token, cfg.jwt_secret, algorithms=[cfg.jwt_algorithm])
