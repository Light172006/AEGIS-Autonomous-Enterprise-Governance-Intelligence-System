"""User management endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.dependencies import require_admin, get_db
from backend.models import Document, User
from backend.schemas import RoleUpdate, StatusUpdate, UserCreate, UserOut
from backend.security import hash_password
from backend.utils import user_to_out

router = APIRouter(tags=["users"])

@router.get("/users", response_model=List[UserOut])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [user_to_out(u, db) for u in users]

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
    return user_to_out(user, db)

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
    return user_to_out(user, db)

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
    return user_to_out(user, db)

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
    return user_to_out(user, db)

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

