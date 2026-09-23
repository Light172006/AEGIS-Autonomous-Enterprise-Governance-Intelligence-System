"""
Test file for documents API.
"""
import pytest
import io
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base
from backend.dependencies import get_db, get_config
from backend.security import hash_password, create_access_token
from backend.models import User, Document, Conversation, Message
from backend.config import BackendConfig

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

def _create_admin() -> tuple[str, str]:
    """Create admin user and return (user_id, jwt_token)."""
    db = TestSession()
    user = User(
        id="test_admin",
        email="admin@test.local",
        name="Test Admin",
        role="admin",
        status="active",
        department="Test",
        hashed_password=hash_password("testpass"),
    )
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()
    token = create_access_token("test_admin", "admin", get_test_config())
    return user_id, token

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

def test_list_documents_empty():
    _, token = _create_user()
    response = client.get("/api/v1/documents", headers=_auth_header(token))
    assert response.status_code == 200
    assert response.json() == []

@patch("backend.routers.documents.run_ingestion_background")
def test_upload_document(mock_ingest):
    _, token = _create_user()
    mock_ingest.return_value = None
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    response = client.post("/api/v1/documents/upload", headers=_auth_header(token), files=files)
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["status"] in ["uploaded", "processing"]
    assert data["filename"] == "test.pdf"

@patch("backend.routers.documents.run_ingestion_background")
def test_list_documents_after_upload(mock_ingest):
    _, token = _create_user()
    mock_ingest.return_value = None
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    client.post("/api/v1/documents/upload", headers=_auth_header(token), files=files)

    response = client.get("/api/v1/documents", headers=_auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["filename"] == "test.pdf"

@patch("backend.routers.documents.run_ingestion_background")
def test_get_document_by_id(mock_ingest):
    _, token = _create_user()
    mock_ingest.return_value = None
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    upload_res = client.post("/api/v1/documents/upload", headers=_auth_header(token), files=files)
    doc_id = upload_res.json()["id"]

    response = client.get(f"/api/v1/documents/{doc_id}", headers=_auth_header(token))
    assert response.status_code == 200
    assert response.json()["id"] == doc_id

@patch("backend.routers.documents.run_ingestion_background")
def test_delete_document(mock_ingest):
    _, token = _create_admin()
    mock_ingest.return_value = None
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    upload_res = client.post("/api/v1/documents/upload", headers=_auth_header(token), files=files)
    doc_id = upload_res.json()["id"]

    del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=_auth_header(token))
    assert del_res.status_code == 200

    get_res = client.get(f"/api/v1/documents/{doc_id}", headers=_auth_header(token))
    assert get_res.status_code == 404

def test_unauthorized_access():
    response = client.get("/api/v1/documents")
    assert response.status_code in [401, 403]
