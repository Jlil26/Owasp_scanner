import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.models.report import Report

class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_report(
        self,
        company_id: uuid.UUID,
        scan_job_id: uuid.UUID,
        file_hash: str,
        title: str,
        version: str,
        report_format: str,
        owasp_category: Optional[str] = None,
        pdf_path: Optional[str] = None,
        html_content: Optional[str] = None,
        json_content: Optional[str] = None,
        summary: Optional[str] = None
    ) -> Report:
        report = Report(
            id=uuid.uuid4(),
            company_id=company_id,
            scan_job_id=scan_job_id,
            file_hash=file_hash,
            title=title,
            version=version,
            report_format=report_format,
            owasp_category=owasp_category,
            pdf_path=pdf_path,
            html_content=html_content,
            json_content=json_content,
            summary=summary
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_by_id(self, report_id: uuid.UUID, company_id: uuid.UUID) -> Optional[Report]:
        stmt = select(Report).where(
            Report.id == report_id,
            Report.company_id == company_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all_by_company(
        self, company_id: uuid.UUID, page: int = 1, size: int = 20
    ) -> Tuple[List[Report], int]:
        count_stmt = select(func.count(Report.id)).where(Report.company_id == company_id)
        total = self.db.execute(count_stmt).scalar() or 0

        offset = (page - 1) * size
        stmt = (
            select(Report)
            .where(Report.company_id == company_id)
            .order_by(desc(Report.created_at))
            .offset(offset)
            .limit(size)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def get_reports_by_scan_job(
        self, scan_job_id: uuid.UUID, company_id: uuid.UUID
    ) -> List[Report]:
        stmt = (
            select(Report)
            .where(
                Report.scan_job_id == scan_job_id,
                Report.company_id == company_id
            )
            .order_by(desc(Report.created_at))
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_next_version(self, scan_job_id: uuid.UUID, company_id: uuid.UUID) -> str:
        existing = self.get_reports_by_scan_job(scan_job_id, company_id)
        if not existing:
            return "1.0"
        return f"{1 + len(existing)}.0"
