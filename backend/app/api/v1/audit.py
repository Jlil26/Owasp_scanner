import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.services.audit_service import AuditService
from app.schemas.audit import AuditLogListResponse
from app.schemas.common import StandardResponse
from app.models.user import User
from app.models.enums import AuditActionStatus

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get(
    "/logs",
    response_model=StandardResponse[AuditLogListResponse],
    summary="Query audit logs for current tenant"
)
def get_audit_logs(
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    status: Optional[AuditActionStatus] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AuditService(db)
    result = service.get_logs(
        current_user=current_user,
        user_id=user_id,
        action=action,
        status=status,
        page=page,
        size=size
    )
    return StandardResponse(
        success=True,
        message="Audit logs retrieved successfully",
        data=result
    )
