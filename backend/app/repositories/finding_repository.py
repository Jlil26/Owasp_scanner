import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm Session
from sqlalchemy import select, func, desc

from app.models.finding import Finding
from app.models.scan import ScanJob

class FindingRepository:
    def create_finding(
        self,
        db: Session,
        scan_job_id: uuid.UUID,
        scanner_name: str,
        title: str,
        tool_execution_id: Optional[uuid.UUID] = None,
        severity: Optional[str] = "Medium",
        description: Optional[str] = None,
        http_request: Optional[str] = None,
        http_response: Optional[str] = None,
        evidence_notes: Optional[str] = None,
        raw_data: Optional[Dict[str, Any]] = None
    ) -> Finding:
        finding = Finding(
            id=uuid.uuid4(),
            scan_job_id=scan_job_id,
            tool_execution_id=tool_execution_id,
            scanner_name=scanner_name,
            title=title,
            severity=severity,
            description=description,
            http_request=http_request,
            http_response=http_response,
            evidence_notes=evidence_notes,
            raw_data=raw_data
        )
        db.add(finding)
        db.commit()
        db.refresh(finding)
        return finding

    def get_by_id(self, db: Session, finding_id: uuid.UUID) -> Optional[Finding]:
        stmt = select(Finding).where(Finding.id == finding_id)
        return db.execute(stmt).scalar_one_or_none()

    def get_all_by_company(
        self,
        db: Session,
        company_id: uuid.UUID,
        scan_job_id: Optional[uuid.UUID] = None,
        tool_execution_id: Optional[uuid.UUID] = None,
        scanner_name: Optional[str] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Finding], int]:
        stmt = select(Finding).join(ScanJob).where(ScanJob.company_id == company_id)

        if scan_job_id:
            stmt = stmt.where(Finding.scan_job_id == scan_job_id)
        if tool_execution_id:
            stmt = stmt.where(Finding.tool_execution_id == tool_execution_id)
        if scanner_name:
            stmt = stmt.where(Finding.scanner_name.ilike(f"%{scanner_name}%"))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.execute(count_stmt).scalar() or 0

        stmt = stmt.order_by(desc(Finding.created_at)).offset((page - 1) * size).limit(size)
        items = list(db.execute(stmt).scalars().all())

        return items, total
