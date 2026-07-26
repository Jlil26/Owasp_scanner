import unittest
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import BaseModel
from app.models.company import Company
from app.models.user import User
from app.models.role import Role
from app.models.target import Target
from app.models.scan import ScanJob, ScanJobStatus
from app.models.vulnerability import Vulnerability, VulnerabilityAssignment
from app.models.enums import (
    CompanyStatus,
    UserStatus,
    SystemRoleName,
    VulnerabilitySeverity,
    VulnerabilityStatus
)
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService

class TestSprint8DashboardAnalytics(unittest.TestCase):
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
            name="Sprint 8 Analytics Tenant",
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
        self.admin = User(
            id=uuid.uuid4(),
            company_id=self.company.id,
            role_id=self.admin_role.id,
            email="admin@sprint8.com",
            first_name="Super",
            last_name="Admin",
            hashed_password="hash",
            status=UserStatus.ACTIVE
        )
        self.auditor = User(
            id=uuid.uuid4(),
            company_id=self.company.id,
            role_id=self.auditor_role.id,
            email="auditor@sprint8.com",
            first_name="Auditor",
            last_name="One",
            hashed_password="hash",
            status=UserStatus.ACTIVE
        )
        self.employee = User(
            id=uuid.uuid4(),
            company_id=self.company.id,
            role_id=self.employee_role.id,
            email="employee@sprint8.com",
            first_name="Employee",
            last_name="Dev",
            hashed_password="hash",
            status=UserStatus.ACTIVE
        )
        self.db.add_all([self.admin, self.auditor, self.employee])
        self.db.commit()

        # Seed Sample Vulnerability Findings
        self.v1 = Vulnerability(
            id=uuid.uuid4(),
            company_id=self.company.id,
            title="SQL Injection in Search Form",
            severity=VulnerabilitySeverity.HIGH,
            status=VulnerabilityStatus.ASSIGNED,
            owasp_category="A03:2021-Injection",
            cvss=8.5,
            due_date=datetime.now(timezone.utc) + timedelta(days=14)
        )
        self.v2 = Vulnerability(
            id=uuid.uuid4(),
            company_id=self.company.id,
            title="X-Frame-Options Header Missing",
            severity=VulnerabilitySeverity.LOW,
            status=VulnerabilityStatus.RESOLVED,
            owasp_category="A05:2021-Security Misconfiguration",
            cvss=3.1,
            due_date=datetime.now(timezone.utc) + timedelta(days=60)
        )
        self.db.add_all([self.v1, self.v2])
        self.db.commit()

        # Assign v1 to employee
        self.assignment = VulnerabilityAssignment(
            id=uuid.uuid4(),
            vulnerability_id=self.v1.id,
            assigned_to_user_id=self.employee.id,
            assigned_by_user_id=self.auditor.id,
            notes="Please patch query escaping"
        )
        self.db.add(self.assignment)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_security_score_calculation(self):
        service = AnalyticsService(self.db)
        res = service.calculate_security_score(self.company.id)

        self.assertIsNotNone(res.score)
        self.assertTrue(0 <= res.score <= 100)
        self.assertIn(res.grade, ["A", "B", "C", "D", "F"])
        self.assertIn(res.risk_level, ["LOW", "MEDIUM", "HIGH", "CRITICAL"])
        self.assertIn("high", res.penalty_breakdown)
        self.assertEqual(len(res.historical_scores), 7)

    def test_owasp_breakdown(self):
        service = AnalyticsService(self.db)
        res = service.get_owasp_breakdown(self.company.id)

        self.assertEqual(res.total_findings, 2)
        self.assertEqual(len(res.categories), 10)
        # Check A03 Injection is counted
        a03 = next(c for c in res.categories if c.code == "A03")
        self.assertEqual(a03.count, 1)

    def test_trends_and_scanner_stats(self):
        service = AnalyticsService(self.db)
        trends = service.get_trends(self.company.id, days=7)
        self.assertEqual(len(trends.trend), 7)

        stats = service.get_scanner_stats(self.company.id)
        self.assertEqual(len(stats.tools), 3)

    def test_realtime_feed(self):
        service = AnalyticsService(self.db)
        feed = service.get_realtime_feed(self.company.id)

        self.assertIsNotNone(feed.events)
        self.assertGreaterEqual(feed.pending_verifications_count, 1)

    def test_role_dashboards_with_analytics_integration(self):
        dash_svc = DashboardService(self.db)

        admin_dash = dash_svc.get_admin_dashboard(self.company.id)
        self.assertIsNotNone(admin_dash.security_score)
        self.assertIsNotNone(admin_dash.security_grade)

        auditor_dash = dash_svc.get_auditor_dashboard(self.company.id, self.auditor.id)
        self.assertIsNotNone(auditor_dash.security_score)

        employee_dash = dash_svc.get_employee_dashboard(self.company.id, self.employee.id)
        self.assertEqual(employee_dash.assigned_vulnerabilities, 1)

if __name__ == "__main__":
    unittest.main()
