import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.target_repository import TargetRepository
from app.repositories.asset_repository import AssetRepository
from app.repositories.user_repository import UserRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.target import TargetCreate, TargetUpdate, AssignAuditorRequest, TargetResponse
from app.models.user import User

class TargetService:
    def __init__(self, db: Session):
        self.db = db
        self.target_repo = TargetRepository(db)
        self.asset_repo = AssetRepository(db)
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditRepository(db)

    def _to_response(self, target) -> TargetResponse:
        auditor_email = target.auditor.email if target.auditor else None
        return TargetResponse(
            id=target.id,
            company_id=target.company_id,
            asset_id=target.asset_id,
            auditor_id=target.auditor_id,
            url=target.url,
            is_active=target.is_active,
            auditor_email=auditor_email,
            created_at=target.created_at,
            updated_at=target.updated_at
        )

    def list_targets(self, current_user: User, skip: int = 0, limit: int = 100) -> List[TargetResponse]:
        role_name = current_user.role.name if current_user.role else "EMPLOYEE"
        
        # If role is AUDITOR, strictly list targets assigned to this auditor
        if role_name == "AUDITOR":
            targets = self.target_repo.get_all_by_company(
                company_id=current_user.company_id,
                auditor_id=current_user.id,
                skip=skip,
                limit=limit
            )
        else:
            targets = self.target_repo.get_all_by_company(
                company_id=current_user.company_id,
                skip=skip,
                limit=limit
            )
        return [self._to_response(t) for t in targets]

    def get_target(self, target_id: uuid.UUID, current_user: User) -> TargetResponse:
        target = self.target_repo.get_by_id(target_id, company_id=current_user.company_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target not found"
            )

        role_name = current_user.role.name if current_user.role else "EMPLOYEE"
        if role_name == "AUDITOR" and target.auditor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to target not assigned to you"
            )

        return self._to_response(target)

    def create_target(
        self,
        obj_in: TargetCreate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TargetResponse:
        asset = self.asset_repo.get_by_id(obj_in.asset_id, company_id=current_user.company_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset not found in current company"
            )

        target = self.target_repo.create(company_id=current_user.company_id, obj_in=obj_in)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="CREATE_TARGET",
            resource_type="TARGET",
            resource_id=str(target.id),
            new_value={"asset_id": str(target.asset_id), "url": target.url},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self.get_target(target.id, current_user)

    def update_target(
        self,
        target_id: uuid.UUID,
        obj_in: TargetUpdate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TargetResponse:
        target = self.target_repo.get_by_id(target_id, company_id=current_user.company_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target not found"
            )

        old_val = {"url": target.url, "is_active": target.is_active}
        updated = self.target_repo.update(target, obj_in)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="UPDATE_TARGET",
            resource_type="TARGET",
            resource_id=str(target_id),
            old_value=old_val,
            new_value={"url": updated.url, "is_active": updated.is_active},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self.get_target(target_id, current_user)

    def assign_auditor(
        self,
        target_id: uuid.UUID,
        auditor_id: Optional[uuid.UUID],
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TargetResponse:
        target = self.target_repo.get_by_id(target_id, company_id=current_user.company_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target not found"
            )

        if auditor_id:
            auditor = self.user_repo.get_by_id(auditor_id)
            if not auditor or auditor.company_id != current_user.company_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specified auditor not found in company"
                )

        updated_target = self.target_repo.assign_auditor(
            target_id=target_id,
            company_id=current_user.company_id,
            auditor_id=auditor_id
        )

        action_name = "ASSIGN_AUDITOR" if auditor_id else "UNASSIGN_AUDITOR"
        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action=action_name,
            resource_type="TARGET",
            resource_id=str(target_id),
            new_value={"auditor_id": str(auditor_id) if auditor_id else None},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self._to_response(updated_target)

    def delete_target(
        self,
        target_id: uuid.UUID,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        target = self.target_repo.get_by_id(target_id, company_id=current_user.company_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target not found"
            )

        self.target_repo.soft_delete(target_id, current_user.company_id)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="DELETE_TARGET",
            resource_type="TARGET",
            resource_id=str(target_id),
            old_value={"url": target.url},
            ip_address=ip_address,
            user_agent=user_agent
        )
