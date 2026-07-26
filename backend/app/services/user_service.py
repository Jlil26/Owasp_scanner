import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, ResetPasswordRequest, UserResponse
from app.models.user import User
from app.models.enums import UserStatus

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)
        self.audit_repo = AuditRepository(db)

    def list_users(self, current_user: User, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        users = self.user_repo.get_all_by_company(current_user.company_id, skip=skip, limit=limit)
        results = []
        for u in users:
            role_name = u.role.name if u.role else None
            ur = UserResponse(
                id=u.id,
                company_id=u.company_id,
                email=u.email,
                first_name=u.first_name,
                last_name=u.last_name,
                status=u.status,
                role_id=u.role_id,
                role_name=role_name,
                last_login=u.last_login,
                created_at=u.created_at,
                updated_at=u.updated_at
            )
            results.append(ur)
        return results

    def get_user(self, user_id: uuid.UUID, current_user: User) -> UserResponse:
        user = self.user_repo.get_by_id(user_id)
        if not user or user.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        role_name = user.role.name if user.role else None
        return UserResponse(
            id=user.id,
            company_id=user.company_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            status=user.status,
            role_id=user.role_id,
            role_name=role_name,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    def create_user(
        self,
        obj_in: UserCreate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserResponse:
        # Check existing email
        existing = self.user_repo.get_by_email(obj_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )

        role = self.role_repo.get_role_by_id(obj_in.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role ID"
            )

        hashed_pwd = get_password_hash(obj_in.password)
        new_user = self.user_repo.create(
            company_id=current_user.company_id,
            email=obj_in.email,
            password_hash=hashed_pwd,
            role_id=obj_in.role_id,
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            status=UserStatus.ACTIVE
        )

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="CREATE_USER",
            resource_type="USER",
            resource_id=str(new_user.id),
            new_value={"email": new_user.email, "role": role.name},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return UserResponse(
            id=new_user.id,
            company_id=new_user.company_id,
            email=new_user.email,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            status=new_user.status,
            role_id=new_user.role_id,
            role_name=role.name,
            last_login=new_user.last_login,
            created_at=new_user.created_at,
            updated_at=new_user.updated_at
        )

    def update_user(
        self,
        user_id: uuid.UUID,
        obj_in: UserUpdate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserResponse:
        user = self.user_repo.get_by_id(user_id)
        if not user or user.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        update_data = obj_in.model_dump(exclude_unset=True)
        old_val = {"email": user.email, "first_name": user.first_name, "last_name": user.last_name}
        
        updated = self.user_repo.update_user(user, update_data)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="UPDATE_USER",
            resource_type="USER",
            resource_id=str(user.id),
            old_value=old_val,
            new_value=update_data,
            ip_address=ip_address,
            user_agent=user_agent
        )

        role_name = updated.role.name if updated.role else None
        return UserResponse(
            id=updated.id,
            company_id=updated.company_id,
            email=updated.email,
            first_name=updated.first_name,
            last_name=updated.last_name,
            status=updated.status,
            role_id=updated.role_id,
            role_name=role_name,
            last_login=updated.last_login,
            created_at=updated.created_at,
            updated_at=updated.updated_at
        )

    def delete_user(
        self,
        user_id: uuid.UUID,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        user = self.user_repo.get_by_id(user_id)
        if not user or user.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        self.user_repo.soft_delete(user_id)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="DELETE_USER",
            resource_type="USER",
            resource_id=str(user_id),
            old_value={"email": user.email},
            ip_address=ip_address,
            user_agent=user_agent
        )

    def update_user_status(
        self,
        user_id: uuid.UUID,
        obj_in: UserStatusUpdate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserResponse:
        user = self.user_repo.get_by_id(user_id)
        if not user or user.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        old_status = user.status
        updated = self.user_repo.update_status(user_id, obj_in.status)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="CHANGE_USER_STATUS",
            resource_type="USER",
            resource_id=str(user_id),
            old_value={"status": str(old_status)},
            new_value={"status": str(obj_in.status)},
            ip_address=ip_address,
            user_agent=user_agent
        )

        role_name = updated.role.name if updated.role else None
        return UserResponse(
            id=updated.id,
            company_id=updated.company_id,
            email=updated.email,
            first_name=updated.first_name,
            last_name=updated.last_name,
            status=updated.status,
            role_id=updated.role_id,
            role_name=role_name,
            last_login=updated.last_login,
            created_at=updated.created_at,
            updated_at=updated.updated_at
        )

    def reset_password(
        self,
        user_id: uuid.UUID,
        obj_in: ResetPasswordRequest,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        user = self.user_repo.get_by_id(user_id)
        if not user or user.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        hashed = get_password_hash(obj_in.new_password)
        self.user_repo.update_password(user_id, hashed)

        self.audit_repo.log(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="RESET_USER_PASSWORD",
            resource_type="USER",
            resource_id=str(user_id),
            ip_address=ip_address,
            user_agent=user_agent
        )
