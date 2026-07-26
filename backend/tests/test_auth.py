import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from app.main import app
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_jwt
)
from app.models.user import User
from app.models.company import Company
from app.models.role import Role
from app.models.enums import UserStatus, AuditActionStatus
from app.api.deps import get_db

client = TestClient(app)

# ---------------------------------------------------------
# Unit Tests for Security Core
# ---------------------------------------------------------

def test_password_hashing():
    raw_password = "SuperSecurePassword123!"
    hashed = get_password_hash(raw_password)
    
    assert hashed != raw_password
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False

def test_jwt_access_token_creation_and_decoding():
    user_id = str(uuid.uuid4())
    company_id = str(uuid.uuid4())
    role = "SUPER_ADMIN"

    token = create_access_token(
        subject=user_id,
        company_id=company_id,
        role=role
    )
    
    payload = decode_jwt(token)
    assert payload["sub"] == user_id
    assert payload["company_id"] == company_id
    assert payload["role"] == role
    assert payload["type"] == "access"

def test_jwt_refresh_token():
    user_id = str(uuid.uuid4())
    token = create_refresh_token(subject=user_id)
    
    from app.core.config import settings
    payload = decode_jwt(token, secret_key=settings.JWT_REFRESH_SECRET_KEY)
    assert payload["sub"] == user_id
    assert payload["type"] == "refresh"

def test_jwt_expired_token():
    user_id = str(uuid.uuid4())
    token = create_access_token(
        subject=user_id,
        company_id=str(uuid.uuid4()),
        role="AUDITOR",
        expires_delta=timedelta(seconds=-10) # Expired 10 seconds ago
    )
    raised = False
    try:
        decode_jwt(token)
    except ValueError as e:
        raised = True
        assert "JWT has expired" in str(e)
    assert raised is True

# ---------------------------------------------------------
# Integration Tests for /api/v1/auth Endpoints
# ---------------------------------------------------------

def test_login_success():
    mock_db = MagicMock()
    
    # Setup Mock User & Relationships
    mock_company = Company(id=uuid.uuid4(), name="Acme Security Corp")
    mock_role = Role(id=uuid.uuid4(), name="SUPER_ADMIN")
    password_hash = get_password_hash("ValidPass123!")
    
    mock_user = User(
        id=uuid.uuid4(),
        company_id=mock_company.id,
        email="admin@acme.com",
        password_hash=password_hash,
        first_name="Admin",
        last_name="User",
        status=UserStatus.ACTIVE,
        company=mock_company,
        role=mock_role
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_email", return_value=mock_user), \
         patch("app.repositories.user_repository.UserRepository.get_user_permissions", return_value=["START_SCAN", "READ_AUDIT"]):
        
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@acme.com", "password": "ValidPass123!"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["user"]["email"] == "admin@acme.com"
        assert data["data"]["user"]["role"] == "SUPER_ADMIN"

    app.dependency_overrides.clear()

def test_login_invalid_password():
    mock_db = MagicMock()
    mock_user = User(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email="auditor@company.com",
        password_hash=get_password_hash("CorrectPassword123!"),
        status=UserStatus.ACTIVE
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_email", return_value=mock_user):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "auditor@company.com", "password": "WrongPassword!"}
        )
        
        assert response.status_code == 401

    app.dependency_overrides.clear()

def test_auth_me_endpoint():
    mock_db = MagicMock()
    mock_company = Company(id=uuid.uuid4(), name="Test Company")
    mock_role = Role(id=uuid.uuid4(), name="AUDITOR")
    mock_user = User(
        id=uuid.uuid4(),
        company_id=mock_company.id,
        email="auditor@test.com",
        password_hash="hash",
        first_name="Jane",
        last_name="Auditor",
        status=UserStatus.ACTIVE,
        company=mock_company,
        role=mock_role
    )

    access_token = create_access_token(
        subject=str(mock_user.id),
        company_id=str(mock_user.company_id),
        role="AUDITOR"
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_user), \
         patch("app.repositories.user_repository.UserRepository.get_user_permissions", return_value=["START_SCAN"]):
        
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "auditor@test.com"
        assert data["data"]["role"] == "AUDITOR"
        assert "START_SCAN" in data["data"]["permissions"]

    app.dependency_overrides.clear()
