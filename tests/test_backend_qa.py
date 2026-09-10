"""
Test file for qa API.
"""
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base
from backend.dependencies import get_db, get_config
from backend.security import hash_password, create_access_token
from backend.models import User, Document, Conversation, Message
from backend.config import BackendConfig
from orchestrator.models import OrchestratorDecision, AgentCallRecord

# Test database
TEST_DB_URL = "sqlite:///test_aegis.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=test_engine)

def get_test_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

def get_test_config():
    return BackendConfig(
        database_url=TEST_DB_URL,
        jwt_secret="test-secret",
        jwt_algorithm="HS256",
        jwt_expire_minutes=60,
        upload_dir=Path("test_uploads"),
        cors_origins=["http://localhost:3000"],
        admin_email="admin@test.local",
        admin_password="testpass",
        ollama_base_url="http://localhost:11434",
        ollama_model="test-model",
    )

app.dependency_overrides[get_db] = get_test_db
app.dependency_overrides[get_config] = get_test_config
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

def _create_user() -> tuple[str, str]:
    """Create regular user and return (user_id, jwt_token)."""
    db = TestSession()
    user = User(
        id="test_user",
        email="user@test.local",
        name="Test User",
        role="user",
        status="active",
        department="Engineering",
        hashed_password=hash_password("userpass"),
    )
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()
    token = create_access_token("test_user", "user", get_test_config())
    return user_id, token

def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

mock_decision = OrchestratorDecision(
    goal="test question",
    answer="The answer is 42.",
    status="answered",
    agent_calls=[
        AgentCallRecord(
            agent_name="document_agent",
            task="test question",
            status="answered",
            output="The answer is 42.",
            citations=[{"document_name": "test.pdf", "page_start": 1, "section": "S1", "chunk_id": "c1"}],
        )
    ],
)

# Patch at the point of import inside handle_question (lazy import inside the function)
@patch("agents.document_agent.DocumentAgent")
@patch("orchestrator.orchestrator.Orchestrator")
def test_ask_question(mock_orch_cls, mock_doc_agent):
    _, token = _create_user()
    mock_instance = MagicMock()
    mock_instance.handle.return_value = mock_decision
    mock_orch_cls.return_value = mock_instance

    response = client.post(
        "/api/v1/qa",
        json={"question": "test question"},
        headers=_auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "The answer is 42."
    assert "conversation_id" in data

@patch("agents.document_agent.DocumentAgent")
@patch("orchestrator.orchestrator.Orchestrator")
def test_ask_creates_conversation(mock_orch_cls, mock_doc_agent):
    _, token = _create_user()
    mock_instance = MagicMock()
    mock_instance.handle.return_value = mock_decision
    mock_orch_cls.return_value = mock_instance

    client.post("/api/v1/qa", json={"question": "test question"}, headers=_auth_header(token))

    response = client.get("/api/v1/qa/conversations", headers=_auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

@patch("agents.document_agent.DocumentAgent")
@patch("orchestrator.orchestrator.Orchestrator")
def test_get_conversation(mock_orch_cls, mock_doc_agent):
    _, token = _create_user()
    mock_instance = MagicMock()
    mock_instance.handle.return_value = mock_decision
    mock_orch_cls.return_value = mock_instance

    ask_res = client.post("/api/v1/qa", json={"question": "test question"}, headers=_auth_header(token))
    conv_id = ask_res.json()["conversation_id"]

    response = client.get(f"/api/v1/qa/conversations/{conv_id}", headers=_auth_header(token))
    assert response.status_code == 200
    assert response.json()["id"] == conv_id

def test_list_conversations_empty():
    _, token = _create_user()
    response = client.get("/api/v1/qa/conversations", headers=_auth_header(token))
    assert response.status_code == 200
    assert response.json() == []
