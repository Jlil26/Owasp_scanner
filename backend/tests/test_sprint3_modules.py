import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from app.main import app
from app.api.deps import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.company import Company
from app.models.role import Role, Permission
from app.models.asset import Asset
from app.models.target import Target
from app.models.audit import AuditLog
from app.models.enums import UserStatus, CompanyStatus, AssetType, EnvironmentType, AuditActionStatus

client = TestClient(app)

def create_mock_user(role_name="SUPER_ADMIN", user_id=None, company_id=None):
    uid = user_id or uuid.uuid4()
    cid = company_id or uuid.uuid4()
    company = Company(id=cid, name="Test Company", email="info@test.com", status=CompanyStatus.ACTIVE)
    role = Role(id=uuid.uuid4(), name=role_name, is_system=True)
    user = User(
        id=uid,
        company_id=cid,
        email=f"{role_name.lower()}@test.com",
        password_hash="hashed_pw",
        first_name="Test",
        last_name="User",
        status=UserStatus.ACTIVE,
        company=company,
        role=role,
        role_id=role.id
    )
    return user, company, role

# ---------------------------------------------------------
# Test Companies Module
# ---------------------------------------------------------
def test_list_and_update_companies():
    mock_db = MagicMock()
    user, company, role = create_mock_user("SUPER_ADMIN")
    token = create_access_token(str(user.id), str(company.id), "SUPER_ADMIN")

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=user), \
         patch("app.repositories.company_repository.CompanyRepository.get_by_id", return_value=company), \
         patch("app.repositories.company_repository.CompanyRepository.update", return_value=company), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        # List companies
        resp = client.get("/api/v1/companies", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        assert len(resp.json()["data"]) == 1

        # Patch company
        patch_resp = client.patch(
            f"/api/v1/companies/{company.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": "Updated Corp"}
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["success"] is True

    app.dependency_overrides.clear()

# ---------------------------------------------------------
# Test Users CRUD Module
# ---------------------------------------------------------
def test_users_crud():
    mock_db = MagicMock()
    super_admin, company, role = create_mock_user("SUPER_ADMIN")
    token = create_access_token(str(super_admin.id), str(company.id), "SUPER_ADMIN")

    target_user, _, _ = create_mock_user("EMPLOYEE", company_id=company.id)

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=super_admin), \
         patch("app.repositories.user_repository.UserRepository.get_all_by_company", return_value=[super_admin, target_user]), \
         patch("app.repositories.user_repository.UserRepository.get_by_email", return_value=None), \
         patch("app.repositories.user_repository.UserRepository.create", return_value=target_user), \
         patch("app.repositories.role_repository.RoleRepository.get_role_by_id", return_value=role), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        # List users
        resp = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 2

        # Create user
        create_resp = client.post(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "email": "newemp@test.com",
                "password": "Password123!",
                "first_name": "New",
                "last_name": "Employee",
                "role_id": str(role.id)
            }
        )
        assert create_resp.status_code == 201
        assert create_resp.json()["success"] is True

    app.dependency_overrides.clear()

# ---------------------------------------------------------
# Test Assets & Targets Module
# ---------------------------------------------------------
def test_assets_and_targets_flow():
    mock_db = MagicMock()
    super_admin, company, role = create_mock_user("SUPER_ADMIN")
    token = create_access_token(str(super_admin.id), str(company.id), "SUPER_ADMIN")

    auditor_user, _, auditor_role = create_mock_user("AUDITOR", company_id=company.id)

    mock_asset = Asset(
        id=uuid.uuid4(),
        company_id=company.id,
        type=AssetType.WEBSITE,
        name="Main Web App",
        hostname="app.test.com",
        protocol="https",
        environment=EnvironmentType.PRODUCTION
    )

    mock_target = Target(
        id=uuid.uuid4(),
        company_id=company.id,
        asset_id=mock_asset.id,
        auditor_id=None,
        url="https://app.test.com",
        is_active=True,
        asset=mock_asset,
        auditor=None
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id") as mock_get_user, \
         patch("app.repositories.asset_repository.AssetRepository.get_by_id", return_value=mock_asset), \
         patch("app.repositories.asset_repository.AssetRepository.create", return_value=mock_asset), \
         patch("app.repositories.target_repository.TargetRepository.get_by_id", return_value=mock_target), \
         patch("app.repositories.target_repository.TargetRepository.create", return_value=mock_target), \
         patch("app.repositories.target_repository.TargetRepository.assign_auditor", return_value=mock_target), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        mock_get_user.side_effect = lambda uid: super_admin if uid == super_admin.id else auditor_user

        # Create Asset
        asset_resp = client.post(
            "/api/v1/assets",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "type": "Website",
                "name": "Main Web App",
                "hostname": "app.test.com",
                "environment": "Production"
            }
        )
        assert asset_resp.status_code == 201

        # Create Target
        target_resp = client.post(
            "/api/v1/targets",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "asset_id": str(mock_asset.id),
                "url": "https://app.test.com"
            }
        )
        assert target_resp.status_code == 201

        # Assign Auditor to Target
        assign_resp = client.post(
            f"/api/v1/targets/{mock_target.id}/assign-auditor",
            headers={"Authorization": f"Bearer {token}"},
            json={"auditor_id": str(auditor_user.id)}
        )
        assert assign_resp.status_code == 200

    app.dependency_overrides.clear()

# ---------------------------------------------------------
# Test Audit Logs Querying Module
# ---------------------------------------------------------
def test_audit_logs():
    mock_db = MagicMock()
    user, company, role = create_mock_user("SUPER_ADMIN")
    token = create_access_token(str(user.id), str(company.id), "SUPER_ADMIN")

    mock_log = AuditLog(
        id=uuid.uuid4(),
        company_id=company.id,
        user_id=user.id,
        action="CREATE_TARGET",
        resource_type="TARGET",
        resource_id=str(uuid.uuid4()),
        status=AuditActionStatus.SUCCESS,
        created_at=datetime.now(timezone.utc)
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=user), \
         patch("app.repositories.audit_repository.AuditRepository.get_logs", return_value=([mock_log], 1)):

        resp = client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["total"] == 1
        assert data["items"][0]["action"] == "CREATE_TARGET"

    app.dependency_overrides.clear()
