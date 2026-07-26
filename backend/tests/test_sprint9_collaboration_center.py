import uuid
import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, engine
from app.models import Company, User, Vulnerability, Report, Role, SystemRoleName, VulnerabilitySeverity, VulnerabilityStatus
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

class TestSprint9CollaborationCenter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = Session(bind=engine)

        # Setup company, role, user
        company = Company(name="Test Tenant Collaboration", slug=f"test-collab-{uuid.uuid4().hex[:6]}")
        cls.db.add(company)
        cls.db.commit()

        role = cls.db.query(Role).filter(Role.name == SystemRoleName.AUDITOR.value).first()
        if not role:
            role = Role(name=SystemRoleName.AUDITOR.value, description="Auditor")
            cls.db.add(role)
            cls.db.commit()

        emp_role = cls.db.query(Role).filter(Role.name == SystemRoleName.EMPLOYEE.value).first()
        if not emp_role:
            emp_role = Role(name=SystemRoleName.EMPLOYEE.value, description="Employee")
            cls.db.add(emp_role)
            cls.db.commit()

        auditor = User(
            company_id=company.id,
            role_id=role.id,
            email=f"auditor_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="Alice",
            last_name="Auditor",
            is_active=True
        )
        dev = User(
            company_id=company.id,
            role_id=emp_role.id,
            email=f"dev_{uuid.uuid4().hex[:6]}@test.com",
            hashed_password=get_password_hash("Secret123!"),
            first_name="Bob",
            last_name="Developer",
            is_active=True
        )
        cls.db.add_all([auditor, dev])
        cls.db.commit()

        vuln = Vulnerability(
            company_id=company.id,
            title="Stored Cross-Site Scripting (XSS) in Comments",
            severity=VulnerabilitySeverity.HIGH,
            status=VulnerabilityStatus.ASSIGNED,
            description="Persistent XSS in comment input field."
        )
        cls.db.add(vuln)
        cls.db.commit()

        report = Report(
            company_id=company.id,
            scan_job_id=uuid.uuid4(),
            title="Q3 Security Audit Report",
            file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
        cls.db.add(report)
        cls.db.commit()

        token = create_access_token({"sub": str(auditor.id), "email": auditor.email, "company_id": str(company.id)})
        dev_token = create_access_token({"sub": str(dev.id), "email": dev.email, "company_id": str(company.id)})

        cls.data = {
            "company": company,
            "auditor": auditor,
            "dev": dev,
            "vuln": vuln,
            "report": report,
            "headers": {"Authorization": f"Bearer {token}"},
            "dev_headers": {"Authorization": f"Bearer {dev_token}"}
        }

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_create_and_list_threads(self):
        data = self.data
        payload = {
            "vulnerability_id": str(data["vuln"].id),
            "subject": "Remediation Strategy for XSS",
            "initial_message": "Hey @Bob, please check the sanitization library."
        }

        res = client.post("/api/v1/messaging/threads", json=payload, headers=data["headers"])
        self.assertEqual(res.status_code, 201)
        thread = res.json()
        self.assertEqual(thread["subject"], "Remediation Strategy for XSS")
        self.assertEqual(thread["vulnerability_id"], str(data["vuln"].id))

        # List threads
        list_res = client.get(f"/api/v1/messaging/threads?vulnerability_id={data['vuln'].id}", headers=data["headers"])
        self.assertEqual(list_res.status_code, 200)
        threads = list_res.json()
        self.assertGreaterEqual(len(threads), 1)

    def test_02_send_message_with_mentions(self):
        data = self.data
        # Get thread
        threads_res = client.get(f"/api/v1/messaging/threads?vulnerability_id={data['vuln'].id}", headers=data["headers"])
        thread_id = threads_res.json()[0]["id"]

        msg_payload = {
            "thread_id": thread_id,
            "content": "Thanks @Alice, I have applied DOMPurify on the client side!"
        }
        res = client.post("/api/v1/messaging/messages", json=msg_payload, headers=data["dev_headers"])
        self.assertEqual(res.status_code, 201)
        msg = res.json()
        self.assertIn("@Alice", msg["content"])

        # Check notifications
        notif_res = client.get("/api/v1/notifications", headers=data["headers"])
        self.assertEqual(notif_res.status_code, 200)

    def test_03_upload_and_list_attachments(self):
        data = self.data
        file_content = b"LOG: Found script injection payload <script>alert(1)</script>"
        files = {"file": ("xss_poc.log", file_content, "text/plain")}

        url = f"/api/v1/attachments/upload?resource_type=vulnerability&resource_id={data['vuln'].id}"
        res = client.post(url, files=files, headers=data["dev_headers"])
        self.assertEqual(res.status_code, 201)
        att = res.json()
        self.assertEqual(att["filename"], "xss_poc.log")
        self.assertEqual(att["file_size"], len(file_content))
        self.assertEqual(len(att["sha256_hash"]), 64)

        # List attachments
        list_url = f"/api/v1/attachments?resource_type=vulnerability&resource_id={data['vuln'].id}"
        list_res = client.get(list_url, headers=data["headers"])
        self.assertEqual(list_res.status_code, 200)
        atts = list_res.json()
        self.assertGreaterEqual(len(atts), 1)
        self.assertEqual(atts[0]["filename"], "xss_poc.log")

    def test_04_report_comments_and_activity(self):
        data = self.data
        cmt_payload = {"content": "Verified OWASP Top 10 compliance for @Bob's changes."}

        res = client.post(f"/api/v1/reports/{data['report'].id}/comment", json=cmt_payload, headers=data["headers"])
        self.assertEqual(res.status_code, 201)
        cmt = res.json()["data"]
        self.assertIn("Verified OWASP", cmt["content"])

        # Get comments
        get_res = client.get(f"/api/v1/reports/{data['report'].id}/comments", headers=data["headers"])
        self.assertEqual(get_res.status_code, 200)
        comments = get_res.json()["data"]
        self.assertGreaterEqual(len(comments), 1)

        # Check activity journal feed
        act_res = client.get("/api/v1/activity", headers=data["headers"])
        self.assertEqual(act_res.status_code, 200)
        activities = act_res.json()
        self.assertGreaterEqual(len(activities), 1)
