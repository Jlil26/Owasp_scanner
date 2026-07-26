import unittest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import (
    Company,
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    Session,
    RefreshToken,
    Asset,
    Target,
    ScanJob,
    ToolExecution,
    Finding,
    Vulnerability,
    VulnerabilityAssignment,
    VulnerabilityHistory,
    VulnerabilityComment,
    Report,
    Notification,
    Thread,
    Message,
    AuditLog,
    Setting,
    CompanyStatus,
    UserStatus,
    AssetType,
    EnvironmentType,
    ScanStatus,
    ToolType,
    ToolExecutionStatus,
    VulnerabilitySeverity,
    VulnerabilityStatus,
    NotificationType,
    AuditActionStatus,
)

class TestPersistenceModels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        Base.metadata.create_all(bind=self.engine)
        self.session = self.TestSessionLocal()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_metadata_contains_all_sprint1_tables(self):
        """Verify all 23 declared tables are present in Base metadata."""
        expected_tables = {
            "companies",
            "roles",
            "permissions",
            "users",
            "user_roles",
            "role_permissions",
            "user_sessions",
            "refresh_tokens",
            "assets",
            "targets",
            "scan_jobs",
            "tool_executions",
            "findings",
            "vulnerabilities",
            "vulnerability_assignments",
            "vulnerability_history",
            "vulnerability_comments",
            "reports",
            "notifications",
            "threads",
            "messages",
            "audit_logs",
            "settings",
        }
        registered_tables = set(Base.metadata.tables.keys())
        for table in expected_tables:
            self.assertIn(table, registered_tables)

    def test_company_creation_and_user_relationship(self):
        """Test creating a company, user, role and foreign key relationships."""
        company = Company(
            name="Acme Security Corp",
            legal_name="Acme Corp SARL",
            email="contact@acme.com",
            phone="+33123456789",
            country="France",
            status=CompanyStatus.ACTIVE,
        )
        self.session.add(company)
        self.session.commit()
        self.session.refresh(company)

        self.assertIsInstance(company.id, uuid.UUID)
        self.assertEqual(company.name, "Acme Security Corp")

        role = Role(name="AUDITOR", description="Security Auditor")
        self.session.add(role)
        self.session.commit()
        self.session.refresh(role)

        user = User(
            company_id=company.id,
            first_name="Jean",
            last_name="Dupont",
            email="jean.dupont@acme.com",
            password_hash="hashed_secret_password",
            role_id=role.id,
            status=UserStatus.ACTIVE,
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        self.assertEqual(user.company_id, company.id)
        self.assertEqual(user.company.name, "Acme Security Corp")
        self.assertEqual(len(company.users), 1)
        self.assertEqual(company.users[0].first_name, "Jean")

    def test_scan_job_and_tool_executions(self):
        """Test ScanJob with newly added ToolExecution entities (ZAP, Nmap, Nikto)."""
        company = Company(name="Tech Firm", email="tech@firm.com")
        self.session.add(company)
        self.session.commit()

        asset = Asset(
            company_id=company.id,
            type=AssetType.WEBSITE,
            name="Main Portal",
            hostname="portal.techfirm.com",
            environment=EnvironmentType.PRODUCTION,
        )
        self.session.add(asset)
        self.session.commit()

        target = Target(
            company_id=company.id,
            asset_id=asset.id,
            url="https://portal.techfirm.com",
            is_active=True,
        )
        self.session.add(target)
        self.session.commit()

        scan_job = ScanJob(
            company_id=company.id,
            target_id=target.id,
            status=ScanStatus.RUNNING,
            progress=25,
        )
        self.session.add(scan_job)
        self.session.commit()

        # ToolExecutions for ZAP, Nmap, Nikto
        zap_exec = ToolExecution(
            scan_job_id=scan_job.id,
            tool_type=ToolType.ZAP,
            status=ToolExecutionStatus.RUNNING,
            progress=50,
            logs="[ZAP] Spidering target...",
        )
        nmap_exec = ToolExecution(
            scan_job_id=scan_job.id,
            tool_type=ToolType.NMAP,
            status=ToolExecutionStatus.PENDING,
            progress=0,
        )
        self.session.add_all([zap_exec, nmap_exec])
        self.session.commit()
        self.session.refresh(scan_job)

        self.assertEqual(len(scan_job.tool_executions), 2)
        tool_types = {t.tool_type for t in scan_job.tool_executions}
        self.assertEqual(tool_types, {ToolType.ZAP, ToolType.NMAP})

    def test_findings_and_vulnerability_ai_correlation(self):
        """Test Finding raw scanner results linking to Vulnerability AI correlation."""
        company = Company(name="SecCo", email="info@secco.com")
        self.session.add(company)
        self.session.commit()

        asset = Asset(company_id=company.id, type=AssetType.API, name="Payment API")
        self.session.add(asset)
        self.session.commit()

        target = Target(company_id=company.id, asset_id=asset.id, url="https://api.secco.com")
        self.session.add(target)
        self.session.commit()

        scan_job = ScanJob(company_id=company.id, target_id=target.id, status=ScanStatus.COMPLETED)
        self.session.add(scan_job)
        self.session.commit()

        finding = Finding(
            scan_job_id=scan_job.id,
            scanner_name="ZAP",
            title="SQL Injection in login parameter 'username'",
            severity="HIGH",
            http_request="POST /api/v1/login HTTP/1.1\r\n...",
            http_response="HTTP/1.1 500 Internal Server Error\r\n...",
            raw_data={"param": "username", "evidence": "syntax error near SELECT"},
        )
        self.session.add(finding)
        self.session.commit()

        vuln = Vulnerability(
            company_id=company.id,
            finding_id=finding.id,
            title="SQL Injection in Auth Endpoint",
            severity=VulnerabilitySeverity.CRITICAL,
            cvss=9.8,
            cwe="CWE-89",
            owasp_category="A03:2021-Injection",
            description="User input is directly concatenated into SQL query string.",
            recommendation="Use parameterized queries / prepared statements.",
            status=VulnerabilityStatus.NEW,
        )
        self.session.add(vuln)
        self.session.commit()
        self.session.refresh(vuln)

        self.assertEqual(vuln.company_id, company.id)
        self.assertEqual(vuln.finding_id, finding.id)
        self.assertEqual(vuln.severity, VulnerabilitySeverity.CRITICAL)
        self.assertEqual(vuln.status, VulnerabilityStatus.NEW)

if __name__ == "__main__":
    unittest.main()
