"""Auth endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.config import BackendConfig
from backend.dependencies import get_config, get_current_user, get_db
from backend.models import AuditLog, Document, User
from backend.schemas import AuthResponse, LoginRequest, UserOut
from backend.security import create_access_token, verify_password

router = APIRouter(tags=["auth"])

def _user_to_out(user: User, db: Session) -> UserOut:
    doc_count = db.query(Document).filter(Document.owner_id == user.id).count()
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        status=user.status,
        department=user.department,
        documents_count=doc_count,
        last_login=user.last_login.isoformat() if user.last_login else None,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )

@router.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db), config: BackendConfig = Depends(get_config)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    user.last_login = datetime.utcnow()
    
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
    user_out = _user_to_out(user, db)
    
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
    return _user_to_out(current_user, db)
