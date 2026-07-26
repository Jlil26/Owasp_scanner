import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict
from sqlalchemy.orm import Session

from app.models.enums import ScanStatus, ToolExecutionStatus, ToolType
from app.repositories.scan_repository import ScanRepository
from app.repositories.finding_repository import FindingRepository
from app.repositories.target_repository import TargetRepository
from app.scanner.worker_manager import WorkerManager
from app.scanner.result_collector import ResultCollector
from app.scanner.result_normalizer import ResultNormalizer
from app.scanner.event_manager import EventManager
from app.scanner.job_manager import JobManager

logger = logging.getLogger("owasp_scan_pro.scanner.orchestrator")

class ScanOrchestrator:
    """
    Main Scanner Engine Orchestrator coordinating JobManager, WorkerManager,
    ResultCollector, ResultNormalizer, and EventManager.
    """

    def __init__(self):
        self.scan_repo = ScanRepository()
        self.finding_repo = FindingRepository()
        self.target_repo = TargetRepository()
        self.worker_manager = WorkerManager()
        self.result_collector = ResultCollector()
        self.result_normalizer = ResultNormalizer()
        self.event_manager = EventManager()
        self.job_manager = JobManager()

    async def execute_scan_job(
        self,
        db: Session,
        scan_job_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
        owasp_categories: Optional[List[str]] = None
    ):
        scan_job = self.scan_repo.get_by_id(db, scan_job_id)
        if not scan_job:
            logger.error(f"[ORCHESTRATOR] ScanJob {scan_job_id} not found.")
            return

        target = self.target_repo.get_by_id(db, scan_job.target_id)
        target_url = target.url if (target and target.url) else "https://target-app.local"

        # Update scan job to RUNNING
        self.scan_repo.update_status(
            db,
            scan_job_id,
            status=ScanStatus.RUNNING,
            progress=10,
            started_at=datetime.now(timezone.utc)
        )

        self.event_manager.publish(
            "ScanStarted",
            {
                "scan_job_id": scan_job_id,
                "company_id": scan_job.company_id,
                "user_id": user_id,
                "progress": 10
            },
            db=db
        )

        # Run configured tools in parallel using WorkerManager
        tasks = []
        tool_exec_map: Dict[str, Any] = {}

        for tool_exec in scan_job.tool_executions:
            tool_str = tool_exec.tool_type.value.lower()
            tool_exec_map[tool_str] = tool_exec

            # Mark tool execution as RUNNING
            self.scan_repo.update_tool_execution(
                db,
                tool_exec.id,
                status=ToolExecutionStatus.RUNNING,
                progress=20,
                started_at=datetime.now(timezone.utc)
            )

            tasks.append(
                self.worker_manager.execute_worker(
                    tool_name=tool_str,
                    target_url=target_url,
                    owasp_categories=owasp_categories
                )
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)

        collected_results = []
        for res in results:
            if isinstance(res, Exception):
                logger.error(f"[ORCHESTRATOR] Worker exception: {str(res)}")
                continue

            tool_str = res.tool_name.lower()
            tool_exec = tool_exec_map.get(tool_str)

            if tool_exec:
                exec_status = ToolExecutionStatus.COMPLETED if res.status == "COMPLETED" else ToolExecutionStatus.FAILED
                self.scan_repo.update_tool_execution(
                    db,
                    tool_exec.id,
                    status=exec_status,
                    progress=100 if res.status == "COMPLETED" else 0,
                    return_code=res.return_code,
                    logs=res.logs,
                    completed_at=datetime.now(timezone.utc)
                )

                # Collect & Normalize Findings
                for raw_f in res.raw_findings:
                    norm_data = self.result_normalizer.normalize_finding(
                        scan_job_id=scan_job_id,
                        tool_execution_id=tool_exec.id,
                        tool_name=res.tool_name,
                        raw_finding=raw_f
                    )

                    self.finding_repo.create_finding(
                        db=db,
                        scan_job_id=scan_job_id,
                        scanner_name=norm_data["scanner_name"],
                        title=norm_data["title"],
                        tool_execution_id=tool_exec.id,
                        severity=norm_data["severity"],
                        description=norm_data["description"],
                        http_request=norm_data["http_request"],
                        http_response=norm_data["http_response"],
                        evidence_notes=norm_data["evidence_notes"],
                        raw_data=norm_data["raw_data"]
                    )

        # Finalize Scan Job progress
        self.job_manager.update_job_progress(db, scan_job_id)

        self.event_manager.publish(
            "ScanCompleted",
            {
                "scan_job_id": scan_job_id,
                "company_id": scan_job.company_id,
                "user_id": user_id,
                "progress": 100
            },
            db=db
        )
