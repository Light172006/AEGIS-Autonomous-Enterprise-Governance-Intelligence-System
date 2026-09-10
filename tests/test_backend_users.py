"""
Test file for users API.
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

def test_list_users_as_admin():
    _, token = _create_admin()
    response = client.get("/api/v1/users", headers=_auth_header(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_list_users_as_non_admin():
    _, token = _create_user()
    response = client.get("/api/v1/users", headers=_auth_header(token))
    assert response.status_code == 403

def test_create_user():
    _, token = _create_admin()
    response = client.post(
        "/api/v1/users",
        json={
            "email": "new@test.local",
            "name": "New User",
            "password": "newpassword",
            "role": "user",
            "department": "IT"
        },
        headers=_auth_header(token)
    )
    assert response.status_code in [200, 201]
    assert response.json()["email"] == "new@test.local"

def test_update_role():
    _, admin_token = _create_admin()
    user_id, _ = _create_user()

    response = client.patch(
        f"/api/v1/users/{user_id}/role",
        json={"role": "admin"},
        headers=_auth_header(admin_token)
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"

def test_toggle_status():
    _, admin_token = _create_admin()
    user_id, _ = _create_user()

    response = client.post(
        f"/api/v1/users/{user_id}/toggle-status",
        headers=_auth_header(admin_token)
    )
    assert response.status_code == 200
    assert response.json()["status"] == "suspended"

def test_delete_user():
    _, admin_token = _create_admin()
    user_id, _ = _create_user()

    response = client.delete(
        f"/api/v1/users/{user_id}",
        headers=_auth_header(admin_token)
    )
    assert response.status_code == 200

    # Verify deletion
    get_res = client.get("/api/v1/users", headers=_auth_header(admin_token))
    emails = [u["email"] for u in get_res.json()]
    assert "user@test.local" not in emails
