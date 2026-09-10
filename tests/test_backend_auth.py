"""
Test file for auth API.
"""
import pytest
from pathlib import Path
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

def _create_admin() -> tuple[User, str]:
    """Create admin user and return (user, jwt_token)."""
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
    db.close()
    token = create_access_token("test_admin", "admin", get_test_config())
    return user, token

def _create_user() -> tuple[User, str]:
    """Create regular user and return (user, jwt_token)."""
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
    db.close()
    token = create_access_token("test_user", "user", get_test_config())
    return user, token

def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

def test_login_success():
    _, _ = _create_user()
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.local", "password": "userpass"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user@test.local"

def test_login_wrong_password():
    _, _ = _create_user()
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.local", "password": "wrongpassword"},
    )
    assert response.status_code == 401

def test_login_nonexistent_user():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.local", "password": "userpass"},
    )
    assert response.status_code == 401

def test_me_with_valid_token():
    _, token = _create_user()
    response = client.get("/api/v1/auth/me", headers=_auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@test.local"

def test_me_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code in [401, 403]

def test_logout():
    _, token = _create_user()
    response = client.post("/api/v1/auth/logout", headers=_auth_header(token))
    assert response.status_code == 200
