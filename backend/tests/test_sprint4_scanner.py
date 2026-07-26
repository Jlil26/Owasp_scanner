import uuid
import asyncio
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.company import Company
from app.models.role import Role
from app.models.asset import Asset
from app.models.target import Target
from app.models.scan import ScanJob, ToolExecution
from app.models.finding import Finding
from app.models.enums import UserStatus, CompanyStatus, AssetType, EnvironmentType, ScanStatus, ToolType, ToolExecutionStatus
from app.scanner.adapters.zap_adapter import ZAPAdapter
from app.scanner.adapters.nmap_adapter import NmapAdapter
from app.scanner.adapters.nikto_adapter import NiktoAdapter
from app.scanner.result_normalizer import ResultNormalizer

client = TestClient(app)

def create_mock_user(role_name="AUDITOR", user_id=None, company_id=None):
    uid = user_id or uuid.uuid4()
    cid = company_id or uuid.uuid4()
    company = Company(id=cid, name="Test Cyber Corp", email="security@test.com", status=CompanyStatus.ACTIVE)
    role = Role(id=uuid.uuid4(), name=role_name, is_system=True)
    user = User(
        id=uid,
        company_id=cid,
        email=f"{role_name.lower()}@test.com",
        password_hash="hashed_pw",
        first_name="Auditor",
        last_name="User",
        status=UserStatus.ACTIVE,
        company=company,
        role=role,
        role_id=role.id
    )
    return user, company, role

# ---------------------------------------------------------
# Test Tool Adapters & Result Normalizer
# ---------------------------------------------------------
def test_tool_adapters_and_normalization():
    zap = ZAPAdapter()
    nmap = NmapAdapter()
    nikto = NiktoAdapter()

    assert zap.tool_name == "zap"
    assert nmap.tool_name == "nmap"
    assert nikto.tool_name == "nikto"

    zap_res = asyncio.run(zap.run("https://app.test.com", ["A01", "A03"]))
    assert zap_res.status == "COMPLETED"
    assert len(zap_res.raw_findings) > 0

    normalizer = ResultNormalizer()
    scan_id = uuid.uuid4()
    tool_exec_id = uuid.uuid4()
    norm_f = normalizer.normalize_finding(
        scan_job_id=scan_id,
        tool_execution_id=tool_exec_id,
        tool_name="zap",
        raw_finding=zap_res.raw_findings[0]
    )

    assert norm_f["scanner_name"] == "ZAP"
    assert norm_f["scan_job_id"] == scan_id
    assert "http_request" in norm_f

# ---------------------------------------------------------
# Test Scan Launch (Auditor Only & Target Assignment)
# ---------------------------------------------------------
def test_scan_launch_and_rbac():
    mock_db = MagicMock()
    auditor, company, _ = create_mock_user("AUDITOR")
    auditor_token = create_access_token(str(auditor.id), str(company.id), "AUDITOR")

    super_admin, _, _ = create_mock_user("SUPER_ADMIN", company_id=company.id)
    admin_token = create_access_token(str(super_admin.id), str(company.id), "SUPER_ADMIN")

    mock_target = Target(
        id=uuid.uuid4(),
        company_id=company.id,
        asset_id=uuid.uuid4(),
        auditor_id=auditor.id,
        url="https://app.test.com",
        is_active=True
    )

    mock_job = ScanJob(
        id=uuid.uuid4(),
        company_id=company.id,
        target_id=mock_target.id,
        auditor_id=auditor.id,
        status=ScanStatus.PENDING,
        progress=0,
        started_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id") as mock_get_user, \
         patch("app.repositories.target_repository.TargetRepository.get_by_id", return_value=mock_target), \
         patch("app.repositories.scan_repository.ScanRepository.create_scan_job", return_value=mock_job), \
         patch("app.scanner.scan_manager.ScanManager.launch_scan_background"), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        mock_get_user.side_effect = lambda uid: auditor if uid == auditor.id else super_admin

        # 1. Super Admin attempt to launch scan MUST fail with 403
        admin_resp = client.post(
            "/api/v1/scans",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"target_id": str(mock_target.id), "tools": ["zap", "nmap"]}
        )
        assert admin_resp.status_code == 403
        assert "Auditors are authorized" in admin_resp.json()["message"]

        # 2. Auditor launch scan MUST succeed with 201 Created
        auditor_resp = client.post(
            "/api/v1/scans",
            headers={"Authorization": f"Bearer {auditor_token}"},
            json={"target_id": str(mock_target.id), "tools": ["zap", "nmap", "nikto"]}
        )
        assert auditor_resp.status_code == 201
        assert auditor_resp.json()["success"] is True

    app.dependency_overrides.clear()

# ---------------------------------------------------------
# Test Scan Tracking, History, Status & Cancel
# ---------------------------------------------------------
def test_scan_tracking_and_cancel():
    mock_db = MagicMock()
    auditor, company, _ = create_mock_user("AUDITOR")
    auditor_token = create_access_token(str(auditor.id), str(company.id), "AUDITOR")

    tool_exec_zap = ToolExecution(
        id=uuid.uuid4(),
        scan_job_id=uuid.uuid4(),
        tool_type=ToolType.ZAP,
        status=ToolExecutionStatus.COMPLETED,
        progress=100
    )
    tool_exec_nmap = ToolExecution(
        id=uuid.uuid4(),
        scan_job_id=uuid.uuid4(),
        tool_type=ToolType.NMAP,
        status=ToolExecutionStatus.RUNNING,
        progress=50
    )

    mock_job = ScanJob(
        id=uuid.uuid4(),
        company_id=company.id,
        target_id=uuid.uuid4(),
        auditor_id=auditor.id,
        status=ScanStatus.RUNNING,
        progress=75,
        started_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        tool_executions=[tool_exec_zap, tool_exec_nmap]
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=auditor), \
         patch("app.repositories.scan_repository.ScanRepository.get_by_id", return_value=mock_job), \
         patch("app.repositories.scan_repository.ScanRepository.get_all_by_company", return_value=([mock_job], 1)), \
         patch("app.repositories.scan_repository.ScanRepository.update_status", return_value=mock_job), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        # GET /scans
        list_resp = client.get("/api/v1/scans", headers={"Authorization": f"Bearer {auditor_token}"})
        assert list_resp.status_code == 200
        assert list_resp.json()["data"]["total"] == 1

        # GET /scans/{id}/status
        status_resp = client.get(f"/api/v1/scans/{mock_job.id}/status", headers={"Authorization": f"Bearer {auditor_token}"})
        assert status_resp.status_code == 200
        status_data = status_resp.json()["data"]
        assert status_data["zap"] == "completed"
        assert status_data["nmap"] == "running"

        # POST /scans/{id}/cancel
        mock_job.status = ScanStatus.CANCELLED
        cancel_resp = client.post(f"/api/v1/scans/{mock_job.id}/cancel", headers={"Authorization": f"Bearer {auditor_token}"})
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["data"]["status"] == "CANCELLED"

    app.dependency_overrides.clear()

# ---------------------------------------------------------
# Test Findings List & Detail
# ---------------------------------------------------------
def test_findings_endpoints():
    mock_db = MagicMock()
    auditor, company, _ = create_mock_user("AUDITOR")
    auditor_token = create_access_token(str(auditor.id), str(company.id), "AUDITOR")

    scan_job = ScanJob(id=uuid.uuid4(), company_id=company.id)
    mock_finding = Finding(
        id=uuid.uuid4(),
        scan_job_id=scan_job.id,
        scanner_name="ZAP",
        title="SQL Injection",
        severity="High",
        description="Blind SQL Injection",
        http_request="GET /api/v1/search?q=1' OR 1=1--",
        http_response="HTTP/1.1 200 OK",
        evidence_notes="Injected single quote trace",
        created_at=datetime.now(timezone.utc),
        scan_job=scan_job
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=auditor), \
         patch("app.repositories.finding_repository.FindingRepository.get_all_by_company", return_value=([mock_finding], 1)), \
         patch("app.repositories.finding_repository.FindingRepository.get_by_id", return_value=mock_finding):

        # GET /findings
        findings_resp = client.get("/api/v1/findings", headers={"Authorization": f"Bearer {auditor_token}"})
        assert findings_resp.status_code == 200
        assert findings_resp.json()["data"]["total"] == 1

        # GET /findings/{id}
        detail_resp = client.get(f"/api/v1/findings/{mock_finding.id}", headers={"Authorization": f"Bearer {auditor_token}"})
        assert detail_resp.status_code == 200
        assert detail_resp.json()["data"]["title"] == "SQL Injection"

    app.dependency_overrides.clear()
