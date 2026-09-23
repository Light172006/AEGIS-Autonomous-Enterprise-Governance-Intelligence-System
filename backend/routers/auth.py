"""Auth endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.config import BackendConfig
from backend.dependencies import get_config, get_current_user, get_db
from backend.models import AuditLog, Document, User
from backend.schemas import AuthResponse, LoginRequest, UserOut
from backend.security import create_access_token, verify_password
from backend.utils import user_to_out

router = APIRouter(tags=["auth"])

@router.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db), config: BackendConfig = Depends(get_config)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    user.last_login = datetime.now(timezone.utc)
    
    audit = AuditLog(
        actor=user.name,
        actor_email=user.email,
        action="USER_LOGIN",
        target="system",
        status="success"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(user_id=user.id, role=user.role, config=config)
    user_out = user_to_out(user, db)
    
    return AuthResponse(access_token=access_token, token_type="bearer", user=user_out)

@router.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audit = AuditLog(
        actor=current_user.name,
        actor_email=current_user.email,
        action="USER_LOGOUT",
        target="system",
        status="success"
    )
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}

@router.get("/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_to_out(current_user, db)

