import uuid
import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, engine
from app.models import Company, User, Role, SystemRoleName, AuditLog
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

class TestSprint11ReleaseCandidate(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = Session(bind=engine)

        company = Company(name="Release Candidate Corp", slug=f"rc-{uuid.uuid4().hex[:6]}")
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
        cls.db.commit()

        admin = User(
            company_id=company.id,
            role_id=role_admin.id,
            email=f"admin_rc_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="RC",
            last_name="Admin",
            is_active=True
        )
        cls.db.add(admin)
        cls.db.commit()

        token_admin = create_access_token({"sub": str(admin.id), "email": admin.email, "company_id": str(company.id)})

        cls.data = {
            "company": company,
            "admin": admin,
            "headers": {"Authorization": f"Bearer {token_admin}"}
        }

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_liveness_and_readiness_probes(self):
        res_live = client.get("/api/v1/health/liveness")
        self.assertEqual(res_live.status_code, 200)
        self.assertEqual(res_live.json()["status"], "healthy")

        res_ready = client.get("/api/v1/health/readiness")
        self.assertEqual(res_ready.status_code, 200)
        self.assertIn("checks", res_ready.json())

    def test_02_prometheus_metrics_scraping(self):
        res = client.get("/api/v1/metrics")
        self.assertEqual(res.status_code, 200)
        self.assertIn("owasp_uptime_seconds", res.text)
        self.assertIn("owasp_active_scans_total", res.text)

    def test_03_structured_middleware_headers(self):
        res = client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("x-request-id", res.headers)
        self.assertIn("x-process-time-ms", res.headers)

    def test_04_system_backup_sha256_non_repudiation(self):
        headers = self.data["headers"]
        # Trigger full backup
        res = client.post("/api/v1/system/backups", json={"backup_type": "FULL", "description": "Sprint 11 Release Snapshot"}, headers=headers)
        self.assertEqual(res.status_code, 201)
        bkp = res.json()["data"]
        self.assertEqual(len(bkp["sha256_hash"]), 64)

        # Execute restore simulation with sha256 verification
        res_restore = client.post(f"/api/v1/system/backups/{bkp['id']}/restore", headers=headers)
        self.assertEqual(res_restore.status_code, 200)
        self.assertTrue(res_restore.json()["data"]["verification_passed"])

    def test_05_audit_trail_verification(self):
        # Create an audit entry to verify non-repudiation
        audit = AuditLog(
            company_id=self.data["company"].id,
            user_id=self.data["admin"].id,
            action="RELEASE_CANDIDATE_VERIFICATION",
            resource_type="SYSTEM",
            status="SUCCESS"
        )
        self.db.add(audit)
        self.db.commit()

        headers = self.data["headers"]
        res = client.get("/api/v1/audit/logs", headers=headers)
        self.assertEqual(res.status_code, 200)
        logs = res.json()["data"]
        self.assertTrue(any(l["action"] == "RELEASE_CANDIDATE_VERIFICATION" for l in logs))
