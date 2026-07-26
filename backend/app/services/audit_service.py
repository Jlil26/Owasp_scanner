import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.models.user import User
from app.models.enums import AuditActionStatus

class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditRepository(db)

    def get_logs(
        self,
        current_user: User,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        status: Optional[AuditActionStatus] = None,
        page: int = 1,
        size: int = 50
    ) -> AuditLogListResponse:
        skip = (page - 1) * size
        items, total = self.audit_repo.get_logs(
            company_id=current_user.company_id,
            user_id=user_id,
            action=action,
            status=status,
            skip=skip,
            limit=size
        )

        responses = [AuditLogResponse.model_validate(item) for item in items]
        return AuditLogListResponse(
            items=responses,
            total=total,
            page=page,
            size=size
        )
