import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, update

from app.models.user import User
from app.models.role import Role, Permission, UserRole, RolePermission
from app.models.company import Company
from app.models.enums import UserStatus

class UserRepository:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(
                joinedload(User.company),
                joinedload(User.role),
                joinedload(User.user_roles).joinedload(UserRole.role)
            )
            .where(User.email == email.lower().strip())
            .where(User.deleted_at.is_(None))
        )
        return self.db.execute(stmt).scalars().first()

    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        stmt = (
            select(User)
            .options(
                joinedload(User.company),
                joinedload(User.role),
                joinedload(User.user_roles).joinedload(UserRole.role)
            )
            .where(User.id == user_id)
            .where(User.deleted_at.is_(None))
        )
        return self.db.execute(stmt).scalars().first()

    def get_all_by_company(self, company_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[User]:
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where(User.company_id == company_id)
            .where(User.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        company_id: uuid.UUID,
        email: str,
        password_hash: str,
        role_id: uuid.UUID,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        status: UserStatus = UserStatus.ACTIVE
    ) -> User:
        user = User(
            company_id=company_id,
            email=email.lower().strip(),
            password_hash=password_hash,
            role_id=role_id,
            first_name=first_name,
            last_name=last_name,
            status=status
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: User, update_data: dict) -> User:
        for key, value in update_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete(self, user_id: uuid.UUID) -> bool:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(deleted_at=datetime.now(timezone.utc), status=UserStatus.INACTIVE)
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount > 0

    def update_status(self, user_id: uuid.UUID, status: UserStatus) -> Optional[User]:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .where(User.deleted_at.is_(None))
            .values(status=status)
        )
        self.db.execute(stmt)
        self.db.commit()
        return self.get_by_id(user_id)

    def update_password(self, user_id: uuid.UUID, new_password_hash: str) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(password_hash=new_password_hash)
        )
        self.db.execute(stmt)
        self.db.commit()

    def update_last_login(self, user_id: uuid.UUID, last_login_time) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(last_login=last_login_time)
        )
        self.db.execute(stmt)
        self.db.commit()

    def get_user_permissions(self, user_id: uuid.UUID) -> List[str]:
        stmt = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        permissions = set(self.db.execute(stmt).scalars().all())

        stmt_direct = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(User, User.role_id == RolePermission.role_id)
            .where(User.id == user_id)
        )
        direct_permissions = set(self.db.execute(stmt_direct).scalars().all())
        
        all_perms = list(permissions.union(direct_permissions))
        return all_perms
