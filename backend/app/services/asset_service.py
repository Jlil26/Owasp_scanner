import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.asset_repository import AssetRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.models.user import User

class AssetService:
    def __init__(self, db: Session):
        self.db = db
        self.asset_repo = AssetRepository(db)
        self.audit_repo = AuditRepository(db)

    def list_assets(self, current_user: User, skip: int = 0, limit: int = 100) -> List[AssetResponse]:
        assets = self.asset_repo.get_all_by_company(current_user.company_id, skip=skip, limit=limit)
        return [AssetResponse.model_validate(a) for p in [assets] for a in p]

    def get_asset(self, asset_id: uuid.UUID, current_user: User) -> AssetResponse:
        asset = self.asset_repo.get_by_id(asset_id, company_id=current_user.company_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        return AssetResponse.model_validate(asset)

    def create_asset(
        self,
        obj_in: AssetCreate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AssetResponse:
        asset = self.asset_repo.create(company_id=current_user.company_id, obj_in=obj_in)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="CREATE_ASSET",
            resource_type="ASSET",
            resource_id=str(asset.id),
            new_value={"name": asset.name, "type": str(asset.type)},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return AssetResponse.model_validate(asset)

    def update_asset(
        self,
        asset_id: uuid.UUID,
        obj_in: AssetUpdate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AssetResponse:
        asset = self.asset_repo.get_by_id(asset_id, company_id=current_user.company_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        old_val = {"name": asset.name, "hostname": asset.hostname, "environment": str(asset.environment)}
        updated = self.asset_repo.update(asset, obj_in)
        new_val = {"name": updated.name, "hostname": updated.hostname, "environment": str(updated.environment)}

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="UPDATE_ASSET",
            resource_type="ASSET",
            resource_id=str(asset_id),
            old_value=old_val,
            new_value=new_val,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return AssetResponse.model_validate(updated)

    def delete_asset(
        self,
        asset_id: uuid.UUID,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        asset = self.asset_repo.get_by_id(asset_id, company_id=current_user.company_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        self.asset_repo.soft_delete(asset_id, current_user.company_id)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="DELETE_ASSET",
            resource_type="ASSET",
            resource_id=str(asset_id),
            old_value={"name": asset.name},
            ip_address=ip_address,
            user_agent=user_agent
        )
