import uuid
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, delete

from app.models.role import Role, Permission, RolePermission

class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_roles(self) -> List[Role]:
        stmt = select(Role).options(joinedload(Role.role_permissions).joinedload(RolePermission.permission))
        return list(self.db.execute(stmt).scalars().unique().all())

    def get_role_by_id(self, role_id: uuid.UUID) -> Optional[Role]:
        stmt = (
            select(Role)
            .options(joinedload(Role.role_permissions).joinedload(RolePermission.permission))
            .where(Role.id == role_id)
        )
        return self.db.execute(stmt).scalars().unique().first()

    def get_all_permissions(self) -> List[Permission]:
        stmt = select(Permission)
        return list(self.db.execute(stmt).scalars().all())

    def update_role_permissions(self, role_id: uuid.UUID, permission_ids: List[uuid.UUID]) -> None:
        # Clear existing mappings
        del_stmt = delete(RolePermission).where(RolePermission.role_id == role_id)
        self.db.execute(del_stmt)

        # Insert new mappings
        for perm_id in permission_ids:
            rp = RolePermission(role_id=role_id, permission_id=perm_id)
            self.db.add(rp)

        self.db.commit()
