"""Shared utilities for the AEGIS backend routers."""

from sqlalchemy.orm import Session

from backend.models import Document, User
from backend.schemas import UserOut


def user_to_out(user: User, db: Session) -> UserOut:
    """Convert a User ORM instance to a UserOut schema with document count."""
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
