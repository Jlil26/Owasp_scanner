import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.enums import ScanStatus, ToolExecutionStatus
from app.repositories.scan_repository import ScanRepository

logger = logging.getLogger("owasp_scan_pro.scanner.job_manager")

class JobManager:
    """
    Tracks Job progress and status transitions for ScanJobs and sub-task ToolExecutions.
    """

    def __init__(self):
        self.scan_repo = ScanRepository()

    def update_job_progress(self, db: Session, scan_job_id: uuid.UUID):
        scan_job = self.scan_repo.get_by_id(db, scan_job_id)
        if not scan_job or scan_job.status in [ScanStatus.CANCELLED, ScanStatus.COMPLETED, ScanStatus.FAILED]:
            return

        tool_execs = scan_job.tool_executions
        if not tool_execs:
            return

        total_progress = sum(t.progress for t in tool_execs)
        aggregated_progress = int(total_progress / len(tool_execs))

        all_completed = all(t.status == ToolExecutionStatus.COMPLETED for t in tool_execs)
        any_failed = any(t.status == ToolExecutionStatus.FAILED for t in tool_execs)

        if all_completed:
            self.scan_repo.update_status(
                db,
                scan_job_id,
                status=ScanStatus.COMPLETED,
                progress=100,
                completed_at=datetime.now(timezone.utc)
            )
        elif any_failed and all(t.status in [ToolExecutionStatus.COMPLETED, ToolExecutionStatus.FAILED, ToolExecutionStatus.CANCELLED] for t in tool_execs):
            self.scan_repo.update_status(
                db,
                scan_job_id,
                status=ScanStatus.FAILED,
                progress=aggregated_progress,
                completed_at=datetime.now(timezone.utc),
                error_message="One or more scan tool workers encountered an error."
            )
        else:
            self.scan_repo.update_status(
                db,
                scan_job_id,
                status=ScanStatus.RUNNING,
                progress=aggregated_progress
            )
