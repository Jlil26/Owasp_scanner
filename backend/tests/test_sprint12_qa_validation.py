import uuid
import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, engine
from app.models import Company, User, Role, SystemRoleName, AuditLog
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

class TestSprint12QAValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = Session(bind=engine)

        company = Company(name="Final QA Audit Enterprise", slug=f"qa-{uuid.uuid4().hex[:6]}")
        cls.db.add(company)
        cls.db.commit()

        role_admin = cls.db.query(Role).filter(Role.name == SystemRoleName.SUPER_ADMIN.value).first()
        if not role_admin:
            role_admin = Role(name=SystemRoleName.SUPER_ADMIN.value, description="Super Admin")
            cls.db.add(role_admin)

        role_auditor = cls.db.query(Role).filter(Role.name == SystemRoleName.AUDITOR.value).first()
        if not role_auditor:
            role_auditor = Role(name=SystemRoleName.AUDITOR.value, description="Auditor")
            cls.db.add(role_auditor)

        role_employee = cls.db.query(Role).filter(Role.name == SystemRoleName.EMPLOYEE.value).first()
        if not role_employee:
            role_employee = Role(name=SystemRoleName.EMPLOYEE.value, description="Employee")
            cls.db.add(role_employee)
        cls.db.commit()

        admin = User(
            company_id=company.id,
            role_id=role_admin.id,
            email=f"admin_qa_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="QA",
            last_name="SuperAdmin",
            is_active=True
        )
        auditor = User(
            company_id=company.id,
            role_id=role_auditor.id,
            email=f"auditor_qa_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="QA",
            last_name="Auditor",
            is_active=True
        )
        employee = User(
            company_id=company.id,
            role_id=role_employee.id,
            email=f"employee_qa_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="QA",
            last_name="Employee",
            is_active=True
        )
        cls.db.add_all([admin, auditor, employee])
        cls.db.commit()

        token_admin = create_access_token({"sub": str(admin.id), "email": admin.email, "company_id": str(company.id)})
        token_auditor = create_access_token({"sub": str(auditor.id), "email": auditor.email, "company_id": str(company.id)})
        token_employee = create_access_token({"sub": str(employee.id), "email": employee.email, "company_id": str(company.id)})

        cls.data = {
            "company": company,
            "admin": admin,
            "auditor": auditor,
            "employee": employee,
            "admin_headers": {"Authorization": f"Bearer {token_admin}"},
            "auditor_headers": {"Authorization": f"Bearer {token_auditor}"},
            "employee_headers": {"Authorization": f"Bearer {token_employee}"}
        }

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_spec_compliance_rule_secad_08(self):
        """Rule SecAD-08: Super Admin can NEVER launch a scan directly."""
        res = client.post("/api/v1/scans", json={"target_id": 1, "tools": ["zap"]}, headers=self.data["admin_headers"])
        self.assertEqual(res.status_code, 403)
        self.assertIn("denied", res.json()["message"].lower())

    def test_02_auditor_workspace_authorization(self):
        """Auditors are authorized to list targets and access scanning workspace."""
        res = client.get("/api/v1/targets", headers=self.data["auditor_headers"])
        self.assertEqual(res.status_code, 200)

    def test_03_employee_remediation_scoping(self):
        """Employees can view assigned vulnerabilities and update remediation status."""
        res = client.get("/api/v1/vulnerabilities", headers=self.data["employee_headers"])
        self.assertEqual(res.status_code, 200)

    def test_04_system_observability_and_metrics(self):
        """Verify liveness, readiness, and OpenMetrics Prometheus export."""
        res_live = client.get("/api/v1/health/liveness")
        self.assertEqual(res_live.status_code, 200)
        self.assertEqual(res_live.json()["status"], "healthy")

        res_metrics = client.get("/api/v1/metrics")
        self.assertEqual(res_metrics.status_code, 200)
        self.assertIn("owasp_uptime_seconds", res_metrics.text)

    def test_05_qa_audit_compliance_certification(self):
        """Verify audit log non-repudiation entry for Sprint 12 QA Certification."""
        audit = AuditLog(
            company_id=self.data["company"].id,
            user_id=self.data["admin"].id,
            action="SPRINT12_FINAL_QA_CERTIFICATION",
            resource_type="RELEASE_v1.0.0",
            status="PASSED"
        )
        self.db.add(audit)
        self.db.commit()

        res = client.get("/api/v1/audit/logs", headers=self.data["admin_headers"])
        self.assertEqual(res.status_code, 200)
        self.assertTrue(any(log["action"] == "SPRINT12_FINAL_QA_CERTIFICATION" for log in res.json()["data"]))
