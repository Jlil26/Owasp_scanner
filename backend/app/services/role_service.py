import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.role_repository import RoleRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.role import RoleResponse, PermissionResponse, RolePermissionsUpdate
from app.models.user import User

class RoleService:
    def __init__(self, db: Session):
        self.db = db
        self.role_repo = RoleRepository(db)
        self.audit_repo = AuditRepository(db)

    def list_roles(self) -> List[RoleResponse]:
        roles = self.role_repo.get_all_roles()
        results = []
        for r in roles:
            perms = [
                PermissionResponse(
                    id=rp.permission.id,
                    code=rp.permission.code,
                    name=rp.permission.name,
                    description=rp.permission.description
                ) for rp in r.role_permissions if rp.permission
            ]
            results.append(RoleResponse(
                id=r.id,
                name=r.name,
                description=r.description,
                is_system=r.is_system,
                permissions=perms
            ))
        return results

    def get_role(self, role_id: uuid.UUID) -> RoleResponse:
        role = self.role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        perms = [
            PermissionResponse(
                id=rp.permission.id,
                code=rp.permission.code,
                name=rp.permission.name,
                description=rp.permission.description
            ) for rp in role.role_permissions if rp.permission
        ]
        return RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            is_system=role.is_system,
            permissions=perms
        )

    def list_permissions(self) -> List[PermissionResponse]:
        perms = self.role_repo.get_all_permissions()
        return [PermissionResponse.model_validate(p) for p in perms]

    def update_role_permissions(
        self,
        role_id: uuid.UUID,
        obj_in: RolePermissionsUpdate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> RoleResponse:
        role = self.role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        self.role_repo.update_role_permissions(role_id, obj_in.permission_ids)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="UPDATE_ROLE_PERMISSIONS",
            resource_type="ROLE",
            resource_id=str(role_id),
            new_value={"permission_ids": [str(pid) for pid in obj_in.permission_ids]},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self.get_role(role_id)
