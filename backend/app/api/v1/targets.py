import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.services.target_service import TargetService
from app.schemas.target import TargetCreate, TargetUpdate, AssignAuditorRequest, TargetResponse
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/targets", tags=["Targets"])

@router.get(
    "",
    response_model=StandardResponse[List[TargetResponse]],
    summary="List target scan scope (filtered by role and tenant)"
)
def list_targets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TargetService(db)
    result = service.list_targets(current_user=current_user, skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Targets retrieved successfully",
        data=result
    )

@router.post(
    "",
    response_model=StandardResponse[TargetResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create target from asset (Super Admin only)"
)
def create_target(
    request: Request,
    body: TargetCreate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = TargetService(db)
    result = service.create_target(
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Target created successfully",
        data=result
    )

@router.get(
    "/{id}",
    response_model=StandardResponse[TargetResponse],
    summary="Get target details"
)
def get_target(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TargetService(db)
    result = service.get_target(target_id=id, current_user=current_user)
    return StandardResponse(
        success=True,
        message="Target details retrieved",
        data=result
    )

@router.patch(
    "/{id}",
    response_model=StandardResponse[TargetResponse],
    summary="Update target details (Super Admin only)"
)
def update_target(
    id: uuid.UUID,
    request: Request,
    body: TargetUpdate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = TargetService(db)
    result = service.update_target(
        target_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Target updated successfully",
        data=result
    )

@router.delete(
    "/{id}",
    response_model=StandardResponse[dict],
    summary="Delete target (Super Admin only)"
)
def delete_target(
    id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = TargetService(db)
    service.delete_target(
        target_id=id,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Target deleted successfully",
        data={}
    )

@router.post(
    "/{id}/assign-auditor",
    response_model=StandardResponse[TargetResponse],
    summary="Assign target to Auditor (Super Admin only)"
)
def assign_auditor(
    id: uuid.UUID,
    request: Request,
    body: AssignAuditorRequest,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = TargetService(db)
    result = service.assign_auditor(
        target_id=id,
        auditor_id=body.auditor_id,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Auditor assigned to target successfully",
        data=result
    )

@router.delete(
    "/{id}/assign-auditor",
    response_model=StandardResponse[TargetResponse],
    summary="Unassign auditor from target (Super Admin only)"
)
def unassign_auditor(
    id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = TargetService(db)
    result = service.assign_auditor(
        target_id=id,
        auditor_id=None,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Auditor unassigned from target successfully",
        data=result
    )
