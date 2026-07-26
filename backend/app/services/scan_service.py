import uuid
import asyncio
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.scan import ScanJob
from app.schemas.scan import ScanCreate
from app.repositories.scan_repository import ScanRepository
from app.repositories.finding_repository import FindingRepository
from app.scanner.scan_manager import ScanManager

class ScanService:
    def __init__(self):
        self.scan_repo = ScanRepository()
        self.finding_repo = FindingRepository()
        self.scan_manager = ScanManager()

    def launch_scan(
        self,
        db: Session,
        current_user: User,
        payload: ScanCreate
    ) -> ScanJob:
        scan_job = self.scan_manager.validate_and_create_scan(
            db=db,
            current_user=current_user,
            target_id=payload.target_id,
            tools=payload.tools,
            owasp=payload.owasp
        )

        # Trigger execution (runs background task or async loop)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(
                self.scan_manager.launch_scan_background(
                    db=db,
                    scan_job_id=scan_job.id,
                    user_id=current_user.id,
                    owasp=payload.owasp
                )
            )
        except RuntimeError:
            # Fallback if no async event loop is running in sync thread context (e.g., test client)
            asyncio.run(
                self.scan_manager.launch_scan_background(
                    db=db,
                    scan_job_id=scan_job.id,
                    user_id=current_user.id,
                    owasp=payload.owasp
                )
            )

        return scan_job

    def get_scan(self, db: Session, current_user: User, scan_id: uuid.UUID) -> ScanJob:
        scan_job = self.scan_repo.get_by_id(db, scan_id, company_id=current_user.company_id)
        if not scan_job:
            raise HTTPException(status_code=404, detail="Scan job not found.")
        return scan_job

    def get_scan_status(self, db: Session, current_user: User, scan_id: uuid.UUID) -> dict:
        scan_job = self.get_scan(db, current_user, scan_id)
        
        status_dict = {
            "zap": "pending",
            "nmap": "pending",
            "nikto": "pending"
        }
        for tool_exec in scan_job.tool_executions:
            tool_name = tool_exec.tool_type.value.lower()
            status_dict[tool_name] = tool_exec.status.value.lower()

        return {
            "scan_id": scan_job.id,
            "status": scan_job.status.value,
            "progress": scan_job.progress,
            "zap": status_dict.get("zap", "pending"),
            "nmap": status_dict.get("nmap", "pending"),
            "nikto": status_dict.get("nikto", "pending"),
            "started_at": scan_job.started_at,
            "completed_at": scan_job.completed_at,
            "error_message": scan_job.error_message
        }

    def list_scans(
        self,
        db: Session,
        current_user: User,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[ScanJob], int]:
        auditor_id = current_user.id if (current_user.role and current_user.role.name == "AUDITOR") else None
        return self.scan_repo.get_all_by_company(
            db=db,
            company_id=current_user.company_id,
            auditor_id=auditor_id,
            page=page,
            size=size
        )

    def cancel_scan(self, db: Session, current_user: User, scan_id: uuid.UUID) -> ScanJob:
        return self.scan_manager.cancel_scan(db=db, current_user=current_user, scan_id=scan_id)
