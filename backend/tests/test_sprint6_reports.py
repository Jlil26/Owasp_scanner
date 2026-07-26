import uuid
import json
import hashlib
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.company import Company
from app.models.role import Role
from app.models.scan import ScanJob
from app.models.finding import Finding
from app.models.report import Report
from app.models.enums import UserStatus, CompanyStatus, ScanStatus
from app.services.report_generator_service import ReportGeneratorService

client = TestClient(app)

def create_mock_user(role_name="AUDITOR", user_id=None, company_id=None):
    uid = user_id or uuid.uuid4()
    cid = company_id or uuid.uuid4()
    company = Company(id=cid, name="Acme Cyber PME", email="sec@acme.com", status=CompanyStatus.ACTIVE)
    role = Role(id=uuid.uuid4(), name=role_name, is_system=True)
    user = User(
        id=uid,
        company_id=cid,
        email=f"{role_name.lower()}@acme.com",
        password_hash="hashed_pw",
        first_name="Report",
        last_name="Auditor",
        status=UserStatus.ACTIVE,
        company=company,
        role=role,
        role_id=role.id
    )
    return user, company, role

# ---------------------------------------------------------
# Test 1: Report Generator Engine (HTML, JSON, PDF, SHA-256)
# ---------------------------------------------------------
def test_report_generator_html_json_pdf_sha256():
    scan_id = uuid.uuid4()
    mock_finding = Finding(
        id=uuid.uuid4(),
        scan_job_id=scan_id,
        scanner_name="ZAP",
        title="SQL Injection in Search Endpoint",
        severity="High",
        description="Blind SQL Injection on parameter q",
        http_request="GET /api/v1/search?q=1' OR 1=1--",
        http_response="HTTP/1.1 200 OK",
        evidence_notes="Database error trace detected"
    )

    findings = [mock_finding]

    # HTML Generation
    html = ReportGeneratorService.generate_html_report(
        company_name="Acme Cyber PME",
        target_url="https://app.acme.com",
        scan_job_id=scan_id,
        findings=findings,
        title="Security Audit v1",
        version="1.0"
    )
    assert "OWASP_SCAN_PRO" in html
    assert "Acme Cyber PME" in html
    assert "SQL Injection in Search Endpoint" in html

    # JSON Generation
    json_str = ReportGeneratorService.generate_json_report(
        company_name="Acme Cyber PME",
        target_url="https://app.acme.com",
        scan_job_id=scan_id,
        findings=findings,
        title="Security Audit v1",
        version="1.0"
    )
    data = json.loads(json_str)
    assert data["metadata"]["company_name"] == "Acme Cyber PME"
    assert data["summary"]["total_findings"] == 1
    assert data["summary"]["high"] == 1

    # PDF & SHA-256 Generation
    pdf_bytes, file_hash = ReportGeneratorService.generate_pdf_bytes_and_hash(html)
    assert len(pdf_bytes) > 0
    assert len(file_hash) == 64
    assert hashlib.sha256(pdf_bytes).hexdigest() == file_hash

# ---------------------------------------------------------
# Test 2: OWASP Categories Filtering
# ---------------------------------------------------------
def test_report_owasp_filtering():
    f1 = Finding(title="A01: Broken Access Control", severity="High")
    f2 = Finding(title="A03: SQL Injection", severity="Critical")
    f3 = Finding(title="Sensitive Data Exposure", severity="Medium")

    findings = [f1, f2, f3]

    # Filter for A03
    filtered_a03 = ReportGeneratorService.filter_findings_by_owasp(findings, ["A03"])
    assert len(filtered_a03) == 1
    assert filtered_a03[0].title == "A03: SQL Injection"

    # Filter for A01 and A03
    filtered_both = ReportGeneratorService.filter_findings_by_owasp(findings, ["A01", "A03"])
    assert len(filtered_both) == 2

# ---------------------------------------------------------
# Test 3: Report Generation API Endpoints & Versioning
# ---------------------------------------------------------
def test_report_generation_and_versioning():
    mock_db = MagicMock()
    user, company, _ = create_mock_user("AUDITOR")
    token = create_access_token(str(user.id), str(company.id), "AUDITOR")

    scan_job = ScanJob(
        id=uuid.uuid4(),
        company_id=company.id,
        target_id=uuid.uuid4(),
        auditor_id=user.id,
        status=ScanStatus.COMPLETED,
        progress=100
    )

    mock_report = Report(
        id=uuid.uuid4(),
        company_id=company.id,
        scan_job_id=scan_job.id,
        title="OWASP_SCAN_PRO Security Audit Report",
        version="1.0",
        report_format="PDF",
        file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        pdf_path="/tmp/reports/mock.pdf",
        html_content="<html><body>Report V1</body></html>",
        json_content='{"meta":{}}',
        summary="Report v1.0 generated",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=user), \
         patch("app.repositories.scan_repository.ScanRepository.get_by_id", return_value=scan_job), \
         patch("app.repositories.finding_repository.FindingRepository.get_all_by_scan_job", return_value=[]), \
         patch("app.repositories.company_repository.CompanyRepository.get_by_id", return_value=company), \
         patch("app.repositories.report_repository.ReportRepository.get_next_version", return_value="1.0"), \
         patch("app.repositories.report_repository.ReportRepository.create_report", return_value=mock_report), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        resp = client.post(
            "/api/v1/reports",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "scan_job_id": str(scan_job.id),
                "title": "OWASP_SCAN_PRO Security Audit Report",
                "version": "1.0",
                "report_format": "PDF",
                "owasp_categories": ["A01", "A03"]
            }
        )

        assert resp.status_code == 201
        res_data = resp.json()
        assert res_data["success"] is True
        assert res_data["data"]["version"] == "1.0"
        assert len(res_data["data"]["file_hash"]) == 64

    app.dependency_overrides.clear()

# ---------------------------------------------------------
# Test 4: Download, HTML Preview & SHA-256 Hash Endpoints
# ---------------------------------------------------------
def test_report_download_preview_hash_endpoints():
    mock_db = MagicMock()
    user, company, _ = create_mock_user("AUDITOR")
    token = create_access_token(str(user.id), str(company.id), "AUDITOR")

    report_id = uuid.uuid4()
    mock_report = Report(
        id=report_id,
        company_id=company.id,
        scan_job_id=uuid.uuid4(),
        title="OWASP_SCAN_PRO Audit Report",
        version="1.0",
        report_format="PDF",
        file_hash="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        pdf_path=None,
        html_content="<html><body><h1>HTML Preview</h1></body></html>",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=user), \
         patch("app.repositories.report_repository.ReportRepository.get_by_id", return_value=mock_report), \
         patch("app.repositories.report_repository.ReportRepository.get_all_by_company", return_value=([mock_report], 1)), \
         patch("app.repositories.audit_repository.AuditRepository.log"):

        # 1. GET /reports
        list_resp = client.get("/api/v1/reports", headers={"Authorization": f"Bearer {token}"})
        assert list_resp.status_code == 200
        assert list_resp.json()["data"]["total"] == 1

        # 2. GET /reports/{id}
        detail_resp = client.get(f"/api/v1/reports/{report_id}", headers={"Authorization": f"Bearer {token}"})
        assert detail_resp.status_code == 200
        assert detail_resp.json()["data"]["id"] == str(report_id)

        # 3. GET /reports/{id}/html
        html_resp = client.get(f"/api/v1/reports/{report_id}/html", headers={"Authorization": f"Bearer {token}"})
        assert html_resp.status_code == 200
        assert "HTML Preview" in html_resp.text

        # 4. GET /reports/{id}/download
        dl_resp = client.get(f"/api/v1/reports/{report_id}/download", headers={"Authorization": f"Bearer {token}"})
        assert dl_resp.status_code == 200
        assert dl_resp.headers["content-type"] == "application/pdf"
        assert dl_resp.headers["x-report-sha256"] == mock_report.file_hash

        # 5. GET /reports/{id}/hash
        hash_resp = client.get(f"/api/v1/reports/{report_id}/hash", headers={"Authorization": f"Bearer {token}"})
        assert hash_resp.status_code == 200
        assert hash_resp.json()["data"]["file_hash"] == mock_report.file_hash
        assert hash_resp.json()["data"]["verified"] is True

    app.dependency_overrides.clear()
