"""Dashboard and system endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.config import BackendConfig
from backend.dependencies import get_config, get_current_user, get_db
from backend.models import AuditLog, Document, Message, User
from backend.schemas import AuditLogOut, DashboardResponse, DashboardStatsOut, SystemTelemetryOut
from backend.services.telemetry_service import get_telemetry

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        docs_count = db.query(Document).count()
        questions = db.query(Message).filter(Message.role == "user").count()
        recent_docs = db.query(Document).order_by(Document.created_at.desc()).limit(5).all()
    else:
        docs_count = db.query(Document).filter(Document.owner_id == current_user.id).count()
        # simplified question count
        questions = db.query(Message).join(Message.conversation).filter(Message.role == "user", Message.conversation.has(user_id=current_user.id)).count()
        recent_docs = db.query(Document).filter(Document.owner_id == current_user.id).order_by(Document.created_at.desc()).limit(5).all()
    
    return DashboardResponse(
        stats=DashboardStatsOut(
            documents_count=docs_count,
            questions_asked=questions,
            agent_status="online"
        ),
        recent_documents=recent_docs
    )

@router.get("/system/telemetry", response_model=SystemTelemetryOut)
def get_system_telemetry(
    current_user: User = Depends(get_current_user),
    config: BackendConfig = Depends(get_config)
):
    return get_telemetry(config)

@router.get("/system/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    return logs
