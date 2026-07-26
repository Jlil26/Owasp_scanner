import os
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.report import Report
from app.models.enums import AuditActionStatus
from app.repositories.report_repository import ReportRepository
from app.repositories.scan_repository import ScanRepository
from app.repositories.finding_repository import FindingRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.audit_repository import AuditRepository
from app.services.report_generator_service import ReportGeneratorService

STORAGE_DIR = "/tmp/reports"
os.makedirs(STORAGE_DIR, exist_ok=True)

class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReportRepository(db)
        self.scan_repo = ScanRepository(db)
        self.finding_repo = FindingRepository(db)
        self.company_repo = CompanyRepository(db)
        self.audit_repo = AuditRepository(db)

    def generate_report(
        self,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        user_ip: str,
        scan_job_id: uuid.UUID,
        title: Optional[str] = "OWASP_SCAN_PRO Security Audit Report",
        report_format: str = "PDF",
        owasp_categories: Optional[List[str]] = None
    ) -> Report:
        # 1. Fetch Scan Job
        scan_job = self.scan_repo.get_by_id(scan_job_id, company_id)
        if not scan_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan job not found for this tenant."
            )

        # 2. Fetch Company & Target Details
        company = self.company_repo.get_by_id(company_id)
        company_name = company.name if company else "Tenant Corp"
        target_url = scan_job.target.url if scan_job.target else "Target Scope"

        # 3. Fetch Findings
        all_findings = self.finding_repo.get_all_by_scan_job(scan_job_id, company_id)
        
        # 4. Filter by OWASP Categories if specified
        filtered_findings = ReportGeneratorService.filter_findings_by_owasp(all_findings, owasp_categories)

        # 5. Versioning
        version = self.repo.get_next_version(scan_job_id, company_id)

        # 6. Generate HTML, JSON & PDF
        owasp_str = ", ".join(owasp_categories) if owasp_categories else None
        html_content = ReportGeneratorService.generate_html_report(
            company_name=company_name,
            target_url=target_url,
            scan_job_id=scan_job_id,
            findings=filtered_findings,
            title=title or "OWASP_SCAN_PRO Security Audit Report",
            version=version,
            owasp_filter=owasp_categories
        )

        json_content = ReportGeneratorService.generate_json_report(
            company_name=company_name,
            target_url=target_url,
            scan_job_id=scan_job_id,
            findings=filtered_findings,
            title=title or "OWASP_SCAN_PRO Security Audit Report",
            version=version,
            owasp_filter=owasp_categories
        )

        pdf_bytes, file_hash = ReportGeneratorService.generate_pdf_bytes_and_hash(html_content)

        # 7. Write PDF File to Disk
        report_id = uuid.uuid4()
        pdf_filename = f"{report_id}.pdf"
        pdf_path = os.path.join(STORAGE_DIR, pdf_filename)
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        # 8. Save Record in Database
        summary = f"Audit Report v{version} generated with {len(filtered_findings)} findings. SHA-256: {file_hash[:16]}..."
        report = self.repo.create_report(
            company_id=company_id,
            scan_job_id=scan_job_id,
            file_hash=file_hash,
            title=title,
            version=version,
            report_format=report_format,
            owasp_category=owasp_str,
            pdf_path=pdf_path,
            html_content=html_content,
            json_content=json_content,
            summary=summary
        )

        # 9. Audit Logging
        self.audit_repo.log(
            company_id=company_id,
            user_id=user_id,
            action="GENERATE_REPORT",
            resource_type="report",
            resource_id=str(report.id),
            new_value={"version": version, "file_hash": file_hash, "findings_count": len(filtered_findings)},
            ip_address=user_ip,
            status=AuditActionStatus.SUCCESS
        )

        return report

    def get_report(self, report_id: uuid.UUID, company_id: uuid.UUID) -> Report:
        report = self.repo.get_by_id(report_id, company_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found."
            )
        return report

    def get_all_reports(
        self, company_id: uuid.UUID, page: int = 1, size: int = 20
    ) -> Tuple[List[Report], int]:
        return self.repo.get_all_by_company(company_id, page, size)

    def download_report_pdf(
        self,
        report_id: uuid.UUID,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        user_ip: str
    ) -> Tuple[bytes, str, str]:
        report = self.get_report(report_id, company_id)

        pdf_bytes = None
        if report.pdf_path and os.path.exists(report.pdf_path):
            with open(report.pdf_path, "rb") as f:
                pdf_bytes = f.read()
        else:
            pdf_bytes, _ = ReportGeneratorService.generate_pdf_bytes_and_hash(report.html_content or "Empty Report")

        # Audit download action
        self.audit_repo.log(
            company_id=company_id,
            user_id=user_id,
            action="DOWNLOAD_REPORT",
            resource_type="report",
            resource_id=str(report.id),
            ip_address=user_ip,
            status=AuditActionStatus.SUCCESS
        )

        filename = f"report_{report.id}_{report.version}.pdf"
        return pdf_bytes, filename, report.file_hash

    def view_report_html(
        self,
        report_id: uuid.UUID,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        user_ip: str
    ) -> str:
        report = self.get_report(report_id, company_id)

        # Audit view action
        self.audit_repo.log(
            company_id=company_id,
            user_id=user_id,
            action="VIEW_REPORT",
            resource_type="report",
            resource_id=str(report.id),
            ip_address=user_ip,
            status=AuditActionStatus.SUCCESS
        )

        return report.html_content or "<h1>Report Content Unavailable</h1>"
