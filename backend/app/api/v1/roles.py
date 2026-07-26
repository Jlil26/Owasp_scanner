import uuid
from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.services.role_service import RoleService
from app.schemas.role import RoleResponse, PermissionResponse, RolePermissionsUpdate
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="", tags=["Roles & Permissions"])

@router.get(
    "/roles",
    response_model=StandardResponse[List[RoleResponse]],
    summary="List available roles"
)
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = RoleService(db)
    result = service.list_roles()
    return StandardResponse(
        success=True,
        message="Roles retrieved successfully",
        data=result
    )

@router.get(
    "/roles/{id}",
    response_model=StandardResponse[RoleResponse],
    summary="Get role details"
)
def get_role(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = RoleService(db)
    result = service.get_role(role_id=id)
    return StandardResponse(
        success=True,
        message="Role details retrieved",
        data=result
    )

@router.get(
    "/permissions",
    response_model=StandardResponse[List[PermissionResponse]],
    summary="List all permissions"
)
def list_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = RoleService(db)
    result = service.list_permissions()
    return StandardResponse(
        success=True,
        message="Permissions retrieved successfully",
        data=result
    )

@router.post(
    "/roles/{id}/permissions",
    response_model=StandardResponse[RoleResponse],
    summary="Update role permissions (Super Admin only)"
)
def update_role_permissions(
    id: uuid.UUID,
    request: Request,
    body: RolePermissionsUpdate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = RoleService(db)
    result = service.update_role_permissions(
        role_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Role permissions updated successfully",
        data=result
    )
