import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.models.scan import ScanJob, ToolExecution
from app.models.enums import ScanStatus, ToolType, ToolExecutionStatus

class ScanRepository:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def create_scan_job(
        self,
        db: Session,
        company_id: uuid.UUID,
        target_id: uuid.UUID,
        auditor_id: Optional[uuid.UUID],
        tools: List[str]
    ) -> ScanJob:
        scan_job = ScanJob(
            id=uuid.uuid4(),
            company_id=company_id,
            target_id=target_id,
            auditor_id=auditor_id,
            status=ScanStatus.PENDING,
            progress=0,
            started_at=datetime.now(timezone.utc)
        )
        db.add(scan_job)
        db.flush()

        tool_mapping = {
            "zap": ToolType.ZAP,
            "nmap": ToolType.NMAP,
            "nikto": ToolType.NIKTO
        }

        for tool_str in tools:
            clean_tool = tool_str.strip().lower()
            if clean_tool in tool_mapping:
                tool_type_enum = tool_mapping[clean_tool]
                tool_exec = ToolExecution(
                    id=uuid.uuid4(),
                    scan_job_id=scan_job.id,
                    tool_type=tool_type_enum,
                    status=ToolExecutionStatus.PENDING,
                    progress=0,
                    started_at=None
                )
                db.add(tool_exec)

        db.commit()
        db.refresh(scan_job)
        return scan_job

    def get_by_id(self, db: Session, scan_id: uuid.UUID, company_id: Optional[uuid.UUID] = None) -> Optional[ScanJob]:
        stmt = select(ScanJob).where(ScanJob.id == scan_id)
        if company_id:
            stmt = stmt.where(ScanJob.company_id == company_id)
        return db.execute(stmt).scalar_one_or_none()

    def get_all_by_company(
        self,
        db: Session,
        company_id: uuid.UUID,
        auditor_id: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[ScanJob], int]:
        stmt = select(ScanJob).where(ScanJob.company_id == company_id)
        if auditor_id:
            stmt = stmt.where(ScanJob.auditor_id == auditor_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.execute(count_stmt).scalar() or 0

        stmt = stmt.order_by(desc(ScanJob.created_at)).offset((page - 1) * size).limit(size)
        items = list(db.execute(stmt).scalars().all())

        return items, total

    def update_status(
        self,
        db: Session,
        scan_job_id: uuid.UUID,
        status: ScanStatus,
        progress: Optional[int] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        error_message: Optional[str] = None
    ) -> Optional[ScanJob]:
        scan_job = self.get_by_id(db, scan_job_id)
        if not scan_job:
            return None

        scan_job.status = status
        if progress is not None:
            scan_job.progress = progress
        if started_at is not None:
            scan_job.started_at = started_at
        if completed_at is not None:
            scan_job.completed_at = completed_at
        if error_message is not None:
            scan_job.error_message = error_message

        db.commit()
        db.refresh(scan_job)
        return scan_job

    def update_tool_execution(
        self,
        db: Session,
        tool_execution_id: uuid.UUID,
        status: ToolExecutionStatus,
        progress: Optional[int] = None,
        return_code: Optional[int] = None,
        logs: Optional[str] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None
    ) -> Optional[ToolExecution]:
        stmt = select(ToolExecution).where(ToolExecution.id == tool_execution_id)
        tool_exec = db.execute(stmt).scalar_one_or_none()
        if not tool_exec:
            return None

        tool_exec.status = status
        if progress is not None:
            tool_exec.progress = progress
        if return_code is not None:
            tool_exec.return_code = return_code
        if logs is not None:
            tool_exec.logs = logs
        if started_at is not None:
            tool_exec.started_at = started_at
        if completed_at is not None:
            tool_exec.completed_at = completed_at

        db.commit()
        db.refresh(tool_exec)
        return tool_exec
