"""User management endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.dependencies import require_admin, get_db
from backend.models import Document, User
from backend.schemas import RoleUpdate, StatusUpdate, UserCreate, UserOut
from backend.security import hash_password

router = APIRouter(tags=["users"])

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

@router.get("/users", response_model=List[UserOut])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [_user_to_out(u, db) for u in users]

@router.post("/users", response_model=UserOut)
def create_user(
    request: UserCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    pw = request.password or "aegis-user-2024"
    user = User(
        name=request.name,
        email=request.email,
        role=request.role,
        department=request.department,
        hashed_password=hash_password(pw)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)

@router.patch("/users/{id}/role", response_model=UserOut)
def update_role(
    id: str,
    request: RoleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = request.role
    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)

@router.patch("/users/{id}/status", response_model=UserOut)
def update_status(
    id: str,
    request: StatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = request.status
    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)

@router.post("/users/{id}/toggle-status", response_model=UserOut)
def toggle_status(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "suspended" if user.status == "active" else "active"
    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)

@router.delete("/users/{id}")
def delete_user(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
