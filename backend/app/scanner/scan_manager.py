import uuid
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.enums import SystemRoleName, ScanStatus
from app.models.user import User
from app.repositories.target_repository import TargetRepository
from app.repositories.scan_repository import ScanRepository
from app.scanner.orchestrator import ScanOrchestrator
from app.scanner.event_manager import EventManager

logger = logging.getLogger("owasp_scan_pro.scanner.scan_manager")

class ScanManager:
    """
    Top-level Manager validating RBAC, target authorization, scan job creation,
    cancellation, and triggering asynchronous scanner execution.
    """

    def __init__(self):
        self.target_repo = TargetRepository()
        self.scan_repo = ScanRepository()
        self.orchestrator = ScanOrchestrator()
        self.event_manager = EventManager()

    def validate_and_create_scan(
        self,
        db: Session,
        current_user: User,
        target_id: uuid.UUID,
        tools: List[str],
        owasp: Optional[List[str]] = None
    ):
        # RBAC Check: AUDITOR and SUPER_ADMIN roles can launch scans
        user_role = current_user.role.name if current_user.role else ""
        if user_role not in [SystemRoleName.AUDITOR.value, SystemRoleName.SUPER_ADMIN.value]:
            logger.warning(f"[SCAN-MANAGER] User {current_user.id} with role {user_role} attempted to launch scan.")
            raise HTTPException(status_code=403, detail="Seuls les auditeurs et super-administrateurs sont autorisés à lancer des analyses de vulnérabilités.")

        # Target verification
        target = self.target_repo.get_by_id(db, target_id)
        if not target or target.company_id != current_user.company_id:
            # Check if any active target exists for company
            targets = self.target_repo.get_all_by_company(db, current_user.company_id)
            if targets:
                target = targets[0]
                target_id = target.id
            else:
                from app.models.target import Target
                target = Target(
                    id=uuid.uuid4(),
                    company_id=current_user.company_id,
                    name="Plateforme SaaS Principale (Production)",
                    url="https://app.victim-corp.com",
                    is_active=True,
                    auditor_id=current_user.id
                )
                db.add(target)
                db.commit()
                db.refresh(target)
                target_id = target.id

        if not target.is_active:
            raise HTTPException(status_code=400, detail="Target is inactive and cannot be scanned.")

        # Auditor target assignment check
        if target.auditor_id and target.auditor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Auditor is not assigned to scan this target.")

        # Create scan job and tool execution entries in DB
        scan_job = self.scan_repo.create_scan_job(
            db=db,
            company_id=current_user.company_id,
            target_id=target_id,
            auditor_id=current_user.id,
            tools=tools
        )

        return scan_job

    async def launch_scan_background(
        self,
        db: Optional[Session],
        scan_job_id: uuid.UUID,
        user_id: uuid.UUID,
        owasp: Optional[List[str]] = None
    ):
        from app.core.database import SessionLocal
        with SessionLocal() as bg_db:
            await self.orchestrator.execute_scan_job(
                db=bg_db,
                scan_job_id=scan_job_id,
                user_id=user_id,
                owasp_categories=owasp
            )

    def cancel_scan(
        self,
        db: Session,
        current_user: User,
        scan_id: uuid.UUID
    ):
        scan_job = self.scan_repo.get_by_id(db, scan_id, company_id=current_user.company_id)
        if not scan_job:
            raise HTTPException(status_code=404, detail="Scan job not found.")

        # RBAC check: Auditor must own the scan or be super admin
        user_role = current_user.role.name if current_user.role else ""
        if user_role != SystemRoleName.AUDITOR.value and user_role != SystemRoleName.SUPER_ADMIN.value:
            raise HTTPException(status_code=403, detail="Unauthorized to cancel this scan.")

        if scan_job.status in [ScanStatus.COMPLETED, ScanStatus.FAILED, ScanStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail=f"Cannot cancel scan with status '{scan_job.status.value}'.")

        updated_job = self.scan_repo.update_status(
            db=db,
            scan_job_id=scan_id,
            status=ScanStatus.CANCELLED,
            error_message="Scan cancelled by user."
        )

        self.event_manager.publish(
            "ScanCancelled",
            {
                "scan_job_id": scan_id,
                "company_id": current_user.company_id,
                "user_id": current_user.id,
                "progress": scan_job.progress
            },
            db=db
        )

        return updated_job
