import uuid
from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.services.asset_service import AssetService
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get(
    "",
    response_model=StandardResponse[List[AssetResponse]],
    summary="List assets for current tenant"
)
def list_assets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AssetService(db)
    result = service.list_assets(current_user=current_user, skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Assets retrieved successfully",
        data=result
    )

@router.post(
    "",
    response_model=StandardResponse[AssetResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create asset (Super Admin only)"
)
def create_asset(
    request: Request,
    body: AssetCreate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = AssetService(db)
    result = service.create_asset(
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Asset created successfully",
        data=result
    )

@router.get(
    "/{id}",
    response_model=StandardResponse[AssetResponse],
    summary="Get asset details"
)
def get_asset(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AssetService(db)
    result = service.get_asset(asset_id=id, current_user=current_user)
    return StandardResponse(
        success=True,
        message="Asset details retrieved",
        data=result
    )

@router.patch(
    "/{id}",
    response_model=StandardResponse[AssetResponse],
    summary="Update asset (Super Admin only)"
)
def update_asset(
    id: uuid.UUID,
    request: Request,
    body: AssetUpdate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = AssetService(db)
    result = service.update_asset(
        asset_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Asset updated successfully",
        data=result
    )

@router.delete(
    "/{id}",
    response_model=StandardResponse[dict],
    summary="Delete asset (Super Admin only)"
)
def delete_asset(
    id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = AssetService(db)
    service.delete_asset(
        asset_id=id,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Asset deleted successfully",
        data={}
    )
