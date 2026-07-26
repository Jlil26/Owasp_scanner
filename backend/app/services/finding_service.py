import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.finding import Finding
from app.repositories.finding_repository import FindingRepository

class FindingService:
    def __init__(self):
        self.finding_repo = FindingRepository()

    def list_findings(
        self,
        db: Session,
        current_user: User,
        scan_job_id: Optional[uuid.UUID] = None,
        tool_execution_id: Optional[uuid.UUID] = None,
        scanner_name: Optional[str] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Finding], int]:
        return self.finding_repo.get_all_by_company(
            db=db,
            company_id=current_user.company_id,
            scan_job_id=scan_job_id,
            tool_execution_id=tool_execution_id,
            scanner_name=scanner_name,
            page=page,
            size=size
        )

    def get_finding(self, db: Session, current_user: User, finding_id: uuid.UUID) -> Finding:
        finding = self.finding_repo.get_by_id(db, finding_id)
        if not finding or finding.scan_job.company_id != current_user.company_id:
            raise HTTPException(status_code=404, detail="Finding not found.")
        return finding
