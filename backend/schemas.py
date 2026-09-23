"""Pydantic v2 schemas for the AEGIS backend."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator

def serialize_datetime(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.isoformat()
    return str(v)

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    name: str
    role: str  # "admin" | "user" | "viewer"
    status: str | None = "active"
    department: str | None = ""
    documents_count: int | None = 0
    last_login: str | None = None
    created_at: str

    @field_validator('created_at', 'last_login', mode='before')
    @classmethod
    def serialize_dt(cls, v: Any) -> str | None:
        return serialize_datetime(v)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Users
class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "user"
    department: str = ""
    password: str | None = None  # optional, server generates if missing

class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    status: str

# Documents
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    owner_id: str
    filename: str
    status: str
    pages: int
    created_at: str
    updated_at: str

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def serialize_dt(cls, v: Any) -> str | None:
        return serialize_datetime(v)

# Citations & QA
class CitationOut(BaseModel):
    document_id: str = ""
    document_name: str = ""
    page: int = 0
    section: str = ""
    chunk_id: str = ""
    snippet: str = ""

class QAMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    citations: list[CitationOut] | None = None
    created_at: str

    @field_validator('created_at', mode='before')
    @classmethod
    def serialize_dt(cls, v: Any) -> str | None:
        return serialize_datetime(v)

class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: list[QAMessageOut] = []

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def serialize_dt(cls, v: Any) -> str | None:
        return serialize_datetime(v)

class QARequest(BaseModel):
    question: str
    conversation_id: str | None = None

class QAResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    conversation_id: str

# Dashboard
class DashboardStatsOut(BaseModel):
    documents_count: int
    questions_asked: int
    agent_status: str  # "online" | "offline" | "degraded"

class DashboardResponse(BaseModel):
    stats: DashboardStatsOut
    recent_documents: list[DocumentOut]

class SystemTelemetryOut(BaseModel):
    ollama_status: str  # "online" | "offline" | "busy"
    ollama_model: str
    chroma_status: str  # "connected" | "disconnected"
    total_vectors: int
    memory_usage_pct: float
    cpu_usage_pct: float
    uptime_seconds: int
    avg_latency_ms: float

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    actor: str
    actor_email: str
    action: str
    target: str
    details: str | None = None
    ip_address: str
    timestamp: str
    status: str

    @field_validator('timestamp', mode='before')
    @classmethod
    def serialize_dt(cls, v: Any) -> str | None:
        return serialize_datetime(v)

class HealthResponse(BaseModel):
    status: str
    version: str
    gateway: str | None = None
