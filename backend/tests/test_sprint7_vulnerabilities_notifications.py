import unittest
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import BaseModel
from app.models.company import Company
from app.models.user import User
from app.models.role import Role
from app.models.vulnerability import Vulnerability, VulnerabilityAssignment, VulnerabilityComment
from app.models.notification import Notification
from app.models.enums import (
    CompanyStatus,
    UserStatus,
    SystemRoleName,
    VulnerabilitySeverity,
    VulnerabilityStatus,
    NotificationType
)
from app.services.vulnerability_service import VulnerabilityService
from app.services.notification_service import NotificationService
from app.services.dashboard_service import DashboardService

class TestSprint7VulnerabilityAndNotifications(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        BaseModel.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

        # Seed Company
        self.company = Company(
            id=uuid.uuid4(),
            name="Sprint 7 Test Tenant",
            status=CompanyStatus.ACTIVE
        )
        self.db.add(self.company)

        # Seed Roles
        self.admin_role = Role(id=uuid.uuid4(), name=SystemRoleName.SUPER_ADMIN.value)
        self.auditor_role = Role(id=uuid.uuid4(), name=SystemRoleName.AUDITOR.value)
        self.employee_role = Role(id=uuid.uuid4(), name=SystemRoleName.EMPLOYEE.value)
        self.db.add_all([self.admin_role, self.auditor_role, self.employee_role])
        self.db.commit()

        # Seed Users
        self.auditor = User(
            id=uuid.uuid4(),
            company_id=self.company.id,
            role_id=self.auditor_role.id,
            email="auditor@sprint7.com",
            first_name="Alice",
            last_name="Auditor",
            hashed_password="hash",
            status=UserStatus.ACTIVE
        )
        self.employee = User(
            id=uuid.uuid4(),
            company_id=self.company.id,
            role_id=self.employee_role.id,
            email="employee@sprint7.com",
            first_name="Bob",
            last_name="Developer",
            hashed_password="hash",
            status=UserStatus.ACTIVE
        )
        self.db.add_all([self.auditor, self.employee])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_vulnerability_creation_and_sla(self):
        service = VulnerabilityService(self.db)
        vuln = service.create_vulnerability(
            company_id=self.company.id,
            user_id=self.auditor.id,
            user_ip="127.0.0.1",
            title="SQL Injection in Login Form",
            severity=VulnerabilitySeverity.HIGH,
            cvss=8.1,
            cwe="CWE-89",
            owasp_category="A03:2021-Injection",
            description="Parameter username is vulnerable to SQL injection",
            recommendation="Use parameterized queries"
        )

        self.assertIsNotNone(vuln.id)
        self.assertEqual(vuln.severity, VulnerabilitySeverity.HIGH)
        self.assertEqual(vuln.status, VulnerabilityStatus.NEW)
        self.assertEqual(vuln.remediation_sla_days, 14)
        self.assertIsNotNone(vuln.due_date)

    def test_vulnerability_assignment_and_notifications(self):
        vuln_service = VulnerabilityService(self.db)
        notif_service = NotificationService(self.db)

        vuln = vuln_service.create_vulnerability(
            company_id=self.company.id,
            user_id=self.auditor.id,
            user_ip="127.0.0.1",
            title="Unencrypted Sensitive Data Storage",
            severity=VulnerabilitySeverity.CRITICAL
        )

        # Assign task to Bob Developer
        assignment = vuln_service.assign_employee(
            vulnerability_id=vuln.id,
            company_id=self.company.id,
            assigned_by_user_id=self.auditor.id,
            assigned_to_user_id=self.employee.id,
            user_ip="127.0.0.1",
            notes="Please fix before Friday release"
        )

        self.assertEqual(assignment.assigned_to_user_id, self.employee.id)

        # Check internal notification created for employee
        notifs, total = notif_service.get_my_notifications(user_id=self.employee.id)
        self.assertEqual(total, 1)
        self.assertEqual(notifs[0].type, NotificationType.VULNERABILITY_ASSIGNED)
        self.assertIn("Unencrypted Sensitive Data", notifs[0].title)

    def test_lifecycle_transitions(self):
        vuln_service = VulnerabilityService(self.db)

        vuln = vuln_service.create_vulnerability(
            company_id=self.company.id,
            user_id=self.auditor.id,
            user_ip="127.0.0.1",
            title="Cross-Site Scripting (XSS)",
            severity=VulnerabilitySeverity.MEDIUM
        )

        # Transition NEW -> IN_PROGRESS
        vuln_service.update_status(
            vulnerability_id=vuln.id,
            company_id=self.company.id,
            user_id=self.employee.id,
            user_ip="127.0.0.1",
            new_status=VulnerabilityStatus.IN_PROGRESS,
            summary="Started remediation"
        )
        self.assertEqual(vuln.status, VulnerabilityStatus.IN_PROGRESS)

        # Transition IN_PROGRESS -> RESOLVED
        vuln_service.update_status(
            vulnerability_id=vuln.id,
            company_id=self.company.id,
            user_id=self.employee.id,
            user_ip="127.0.0.1",
            new_status=VulnerabilityStatus.RESOLVED,
            summary="Applied HTML encoding sanitizer"
        )
        self.assertEqual(vuln.status, VulnerabilityStatus.RESOLVED)

        # Transition RESOLVED -> VERIFIED
        vuln_service.update_status(
            vulnerability_id=vuln.id,
            company_id=self.company.id,
            user_id=self.auditor.id,
            user_ip="127.0.0.1",
            new_status=VulnerabilityStatus.VERIFIED,
            summary="Auditor verified fix"
        )
        self.assertEqual(vuln.status, VulnerabilityStatus.VERIFIED)

    def test_dashboards_kpis(self):
        vuln_service = VulnerabilityService(self.db)
        dash_service = DashboardService(self.db)

        vuln_service.create_vulnerability(
            company_id=self.company.id,
            user_id=self.auditor.id,
            user_ip="127.0.0.1",
            title="Flaw 1",
            severity=VulnerabilitySeverity.HIGH
        )

        admin_data = dash_service.get_admin_dashboard(self.company.id)
        self.assertGreaterEqual(admin_data.total_vulnerabilities, 1)

        employee_data = dash_service.get_employee_dashboard(self.company.id, self.employee.id)
        self.assertIsNotNone(employee_data)

if __name__ == "__main__":
    unittest.main()
