import uuid
import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, engine
from app.models import Company, User, Role, SystemRoleName
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

class TestSprint10MonitoringAndPlatformManagement(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = Session(bind=engine)

        company = Company(name="Platform Ops Company", slug=f"ops-{uuid.uuid4().hex[:6]}")
        cls.db.add(company)
        cls.db.commit()

        role = cls.db.query(Role).filter(Role.name == SystemRoleName.SUPER_ADMIN.value).first()
        if not role:
            role = Role(name=SystemRoleName.SUPER_ADMIN.value, description="Super Admin")
            cls.db.add(role)
            cls.db.commit()

        admin = User(
            company_id=company.id,
            role_id=role.id,
            email=f"admin_ops_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="Ops",
            last_name="Admin",
            is_active=True
        )
        cls.db.add(admin)
        cls.db.commit()

        token = create_access_token({"sub": str(admin.id), "email": admin.email, "company_id": str(company.id)})

        cls.data = {
            "company": company,
            "admin": admin,
            "headers": {"Authorization": f"Bearer {token}"}
        }

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_health_probes(self):
        # General health
        res = client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

        # Liveness
        live_res = client.get("/api/v1/health/liveness")
        self.assertEqual(live_res.status_code, 200)
        self.assertEqual(live_res.json()["probe"], "liveness")
        self.assertEqual(live_res.json()["status"], "healthy")

        # Readiness
        ready_res = client.get("/api/v1/health/readiness")
        self.assertEqual(ready_res.status_code, 200)
        self.assertEqual(ready_res.json()["probe"], "readiness")

        # Detailed health
        det_res = client.get("/api/v1/health/detailed")
        self.assertEqual(det_res.status_code, 200)
        det_data = det_res.json()
        self.assertIn("database", det_data)
        self.assertIn("scanner_workers", det_data)

    def test_02_prometheus_metrics_endpoint(self):
        res = client.get("/api/v1/metrics")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/plain", res.headers["content-type"])
        body = res.text
        self.assertIn("# HELP owasp_uptime_seconds", body)
        self.assertIn("owasp_system_cpu_usage_percent", body)
        self.assertIn("owasp_active_scans_total", body)

    def test_03_system_status_and_workers(self):
        headers = self.data["headers"]

        # System status resources
        res = client.get("/api/v1/system/status", headers=headers)
        self.assertEqual(res.status_code, 200)
        st = res.json()["data"]
        self.assertIn("cpu_percent", st)
        self.assertIn("memory_percent", st)
        self.assertIn("disk_percent", st)

        # Workers status
        wrk_res = client.get("/api/v1/system/workers", headers=headers)
        self.assertEqual(wrk_res.status_code, 200)
        workers = wrk_res.json()["data"]
        self.assertGreaterEqual(len(workers), 3)
        self.assertTrue(any(w["tool_name"] == "zap" for w in workers))

        # Security overview
        sec_res = client.get("/api/v1/system/security", headers=headers)
        self.assertEqual(sec_res.status_code, 200)
        sec = sec_res.json()["data"]
        self.assertIn("failed_logins_24h", sec)
        self.assertIn("active_sessions_count", sec)

    def test_04_system_error_logs(self):
        headers = self.data["headers"]
        res = client.get("/api/v1/system/errors?limit=10", headers=headers)
        self.assertEqual(res.status_code, 200)
        errors = res.json()["data"]
        self.assertGreaterEqual(len(errors), 1)

    def test_05_system_backups_and_restore(self):
        headers = self.data["headers"]

        # List backups
        list_res = client.get("/api/v1/system/backups", headers=headers)
        self.assertEqual(list_res.status_code, 200)
        backups = list_res.json()["data"]
        self.assertGreaterEqual(len(backups), 1)

        # Create new backup
        create_res = client.post("/api/v1/system/backups", json={"backup_type": "DATABASE", "description": "Sprint 10 Manual Backup"}, headers=headers)
        self.assertEqual(create_res.status_code, 201)
        new_bkp = create_res.json()["data"]
        self.assertEqual(new_bkp["backup_type"], "DATABASE")
        self.assertEqual(len(new_bkp["sha256_hash"]), 64)

        # Restore backup
        restore_res = client.post(f"/api/v1/system/backups/{new_bkp['id']}/restore", headers=headers)
        self.assertEqual(restore_res.status_code, 200)
        restore_data = restore_res.json()["data"]
        self.assertTrue(restore_data["verification_passed"])
        self.assertEqual(restore_data["status"], "SUCCESS")
