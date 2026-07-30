import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User
from app.models.scan import ScanJob
from app.models.target import Target
from app.models.vulnerability import Vulnerability, VulnerabilityAssignment
from app.models.enums import VulnerabilitySeverity, VulnerabilityStatus
from app.schemas.dashboard import (
    AdminDashboardResponse,
    AuditorDashboardResponse,
    EmployeeDashboardResponse,
    SeverityDistribution,
    StatusDistribution
)

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_admin_dashboard(self, company_id: Optional[uuid.UUID] = None) -> AdminDashboardResponse:
        if company_id is None:
            total_tenants = self.db.execute(select(func.count(Company.id))).scalar() or 1
            total_users = self.db.execute(select(func.count(User.id))).scalar() or 0
            total_scans = self.db.execute(select(func.count(ScanJob.id))).scalar() or 0
            vulnerabilities = list(self.db.execute(select(Vulnerability)).scalars().all())
        else:
            total_tenants = 1
            total_users = self.db.execute(
                select(func.count(User.id)).where(User.company_id == company_id)
            ).scalar() or 0
            total_scans = self.db.execute(
                select(func.count(ScanJob.id)).where(ScanJob.company_id == company_id)
            ).scalar() or 0
            vulnerabilities = list(self.db.execute(
                select(Vulnerability).where(Vulnerability.company_id == company_id)
            ).scalars().all())

        total_vulnerabilities = len(vulnerabilities)
        now = datetime.now(timezone.utc)

        critical = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.CRITICAL)
        high = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.HIGH)
        medium = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.MEDIUM)
        low = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.LOW)
        info = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.INFO)

        status_dist = StatusDistribution(
            new=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.NEW),
            assigned=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.ASSIGNED),
            in_progress=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.IN_PROGRESS),
            resolved=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.RESOLVED),
            verified=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.VERIFIED),
            closed=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.CLOSED),
            reopened=sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.REOPENED)
        )

        resolved_closed = status_dist.resolved + status_dist.verified + status_dist.closed
        remediation_rate = round((resolved_closed / total_vulnerabilities * 100), 1) if total_vulnerabilities > 0 else 100.0

        overdue_slas = sum(
            1 for v in vulnerabilities
            if v.due_date and v.due_date < now and v.status not in [VulnerabilityStatus.VERIFIED, VulnerabilityStatus.CLOSED]
        )

        from app.services.analytics_service import AnalyticsService
        analytics_svc = AnalyticsService(self.db)
        sec_score = analytics_svc.calculate_security_score(company_id)

        return AdminDashboardResponse(
            total_tenants=total_tenants,
            total_users=total_users,
            total_scans=total_scans,
            total_vulnerabilities=total_vulnerabilities,
            active_remediations=status_dist.assigned + status_dist.in_progress,
            overdue_slas=overdue_slas,
            remediation_rate=remediation_rate,
            security_score=sec_score.score,
            security_grade=sec_score.grade,
            severity_distribution=SeverityDistribution(
                critical=critical, high=high, medium=medium, low=low, info=info
            ),
            status_distribution=status_dist
        )

    def get_auditor_dashboard(self, company_id: uuid.UUID, auditor_id: uuid.UUID) -> AuditorDashboardResponse:
        assigned_targets = self.db.execute(
            select(func.count(Target.id)).where(Target.auditor_id == auditor_id, Target.company_id == company_id)
        ).scalar() or 0

        total_scans_executed = self.db.execute(
            select(func.count(ScanJob.id)).where(ScanJob.auditor_id == auditor_id, ScanJob.company_id == company_id)
        ).scalar() or 0

        vulnerabilities = list(self.db.execute(
            select(Vulnerability).where(Vulnerability.company_id == company_id)
        ).scalars().all())

        critical = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.CRITICAL)
        high = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.HIGH)
        medium = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.MEDIUM)
        low = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.LOW)
        info = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.INFO)

        pending_verifications = sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.RESOLVED)

        return AuditorDashboardResponse(
            assigned_targets=assigned_targets,
            total_scans_executed=total_scans_executed,
            vulnerabilities_discovered=len(vulnerabilities),
            pending_verifications=pending_verifications,
            severity_distribution=SeverityDistribution(
                critical=critical, high=high, medium=medium, low=low, info=info
            )
        )

    def get_employee_dashboard(self, company_id: uuid.UUID, employee_id: uuid.UUID) -> EmployeeDashboardResponse:
        assignments = list(self.db.execute(
            select(VulnerabilityAssignment)
            .join(VulnerabilityAssignment.vulnerability)
            .where(
                VulnerabilityAssignment.assigned_to_user_id == employee_id,
                Vulnerability.company_id == company_id
            )
        ).scalars().all())

        assigned_vuln_ids = [a.vulnerability_id for a in assignments]
        if not assigned_vuln_ids:
            return EmployeeDashboardResponse()

        vulnerabilities = list(self.db.execute(
            select(Vulnerability).where(Vulnerability.id.in_(assigned_vuln_ids))
        ).scalars().all())

        now = datetime.now(timezone.utc)
        in_progress_count = sum(1 for v in vulnerabilities if v.status == VulnerabilityStatus.IN_PROGRESS)
        resolved_count = sum(1 for v in vulnerabilities if v.status in [VulnerabilityStatus.RESOLVED, VulnerabilityStatus.VERIFIED, VulnerabilityStatus.CLOSED])
        overdue_count = sum(
            1 for v in vulnerabilities
            if v.due_date and v.due_date < now and v.status not in [VulnerabilityStatus.VERIFIED, VulnerabilityStatus.CLOSED]
        )

        critical = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.CRITICAL)
        high = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.HIGH)
        medium = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.MEDIUM)
        low = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.LOW)
        info = sum(1 for v in vulnerabilities if v.severity == VulnerabilitySeverity.INFO)

        return EmployeeDashboardResponse(
            assigned_vulnerabilities=len(vulnerabilities),
            in_progress_count=in_progress_count,
            resolved_count=resolved_count,
            overdue_count=overdue_count,
            severity_distribution=SeverityDistribution(
                critical=critical, high=high, medium=medium, low=low, info=info
            )
        )
