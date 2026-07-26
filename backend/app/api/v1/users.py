import uuid
from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, ResetPasswordRequest, UserResponse
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get(
    "",
    response_model=StandardResponse[List[UserResponse]],
    summary="List users in company"
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    result = service.list_users(current_user=current_user, skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Users list retrieved",
        data=result
    )

@router.post(
    "",
    response_model=StandardResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create user (Super Admin only)"
)
def create_user(
    request: Request,
    body: UserCreate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserService(db)
    result = service.create_user(
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="User created successfully",
        data=result
    )

@router.get(
    "/{id}",
    response_model=StandardResponse[UserResponse],
    summary="Get user details"
)
def get_user(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    result = service.get_user(user_id=id, current_user=current_user)
    return StandardResponse(
        success=True,
        message="User details retrieved",
        data=result
    )

@router.patch(
    "/{id}",
    response_model=StandardResponse[UserResponse],
    summary="Update user (Super Admin only)"
)
def update_user(
    id: uuid.UUID,
    request: Request,
    body: UserUpdate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserService(db)
    result = service.update_user(
        user_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="User updated successfully",
        data=result
    )

@router.delete(
    "/{id}",
    response_model=StandardResponse[dict],
    summary="Logical delete user (Super Admin only)"
)
def delete_user(
    id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserService(db)
    service.delete_user(
        user_id=id,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="User soft-deleted successfully",
        data={}
    )

@router.patch(
    "/{id}/status",
    response_model=StandardResponse[UserResponse],
    summary="Suspend/reactivate user (Super Admin only)"
)
def update_user_status(
    id: uuid.UUID,
    request: Request,
    body: UserStatusUpdate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserService(db)
    result = service.update_user_status(
        user_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="User status updated successfully",
        data=result
    )

@router.post(
    "/{id}/reset-password",
    response_model=StandardResponse[dict],
    summary="Reset user password (Super Admin only)"
)
def reset_password(
    id: uuid.UUID,
    request: Request,
    body: ResetPasswordRequest,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserService(db)
    service.reset_password(
        user_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Password reset successfully",
        data={}
    )
