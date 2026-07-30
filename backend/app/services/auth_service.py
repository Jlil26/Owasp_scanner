import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_jwt
)
from app.repositories.user_repository import UserRepository
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import (
    LoginResponseData,
    UserSummary,
    RefreshTokenResponseData,
    UserMeResponseData,
    RegisterCompanyResponseData,
    CompanySummary
)
from app.models.enums import UserStatus, AuditActionStatus

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.auth_repo = AuthRepository(db)

    def register_company(
        self,
        admin_name: str,
        email: str,
        password: str,
        company_name: str,
        phone: Optional[str] = None,
        country: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> RegisterCompanyResponseData:
        # 1. Check if email exists
        existing_user = self.user_repo.get_by_email(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte avec cette adresse e-mail existe déjà."
            )

        # 2. Find or Create SUPER_ADMIN role
        from sqlalchemy import select
        from app.models.role import Role
        stmt = select(Role).where(Role.name == "SUPER_ADMIN")
        role = self.db.execute(stmt).scalars().first()
        if not role:
            role = Role(name="SUPER_ADMIN", description="Super Administrator")
            self.db.add(role)
            self.db.commit()
            self.db.refresh(role)

        # 3. Create Company
        from app.models.company import Company
        company = Company(
            name=company_name,
            email=email.lower().strip(),
            phone=phone,
            country=country or "France"
        )
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)

        # 4. Hash Password & Split Names
        password_hash = get_password_hash(password)
        names = admin_name.strip().split(" ")
        first_name = names[0] if names else admin_name
        last_name = " ".join(names[1:]) if len(names) > 1 else "Admin"

        # 5. Create User
        user = self.user_repo.create(
            company_id=company.id,
            email=email,
            password_hash=password_hash,
            role_id=role.id,
            first_name=first_name,
            last_name=last_name,
            status=UserStatus.ACTIVE
        )

        # 6. Generate Tokens
        now = datetime.now(timezone.utc)
        access_token = create_access_token(
            subject=str(user.id),
            company_id=str(company.id),
            role="SUPER_ADMIN"
        )
        refresh_token_str = create_refresh_token(subject=str(user.id))

        # Store session / refresh token
        refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.auth_repo.create_refresh_token(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=refresh_expires
        )

        self.auth_repo.log_audit_event(
            company_id=company.id,
            user_id=user.id,
            action="COMPANY_REGISTERED",
            resource_type="AUTH",
            ip_address=ip_address,
            user_agent=user_agent,
            status=AuditActionStatus.SUCCESS,
            details={"company_name": company_name, "email": email}
        )

        permissions = self.user_repo.get_user_permissions(user.id)

        user_summary = UserSummary(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            company_id=str(company.id),
            company_name=company.name,
            role="SUPER_ADMIN",
            permissions=permissions
        )

        company_summary = CompanySummary(
            id=str(company.id),
            name=company.name,
            slug=company.name.lower().replace(" ", "-"),
            phone=company.phone,
            country=company.country,
            plan="PME_STARTER",
            created_at=company.created_at.isoformat() if company.created_at else now.isoformat()
        )

        return RegisterCompanyResponseData(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            user=user_summary,
            company=company_summary
        )

    def login(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> LoginResponseData:
        user = self.user_repo.get_by_email(email)
        
        if not user:
            # Audit log for failed login attempt (unknown user)
            # Create dummy audit log if default tenant available or omit company_id requirement safely
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(password, user.password_hash):
            self.auth_repo.log_audit_event(
                company_id=user.company_id,
                user_id=user.id,
                action="LOGIN_FAILED",
                resource_type="AUTH",
                ip_address=ip_address,
                user_agent=user_agent,
                status=AuditActionStatus.FAILURE,
                details={"reason": "Invalid password", "email": email}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if user.status != UserStatus.ACTIVE:
            self.auth_repo.log_audit_event(
                company_id=user.company_id,
                user_id=user.id,
                action="LOGIN_BLOCKED",
                resource_type="AUTH",
                ip_address=ip_address,
                user_agent=user_agent,
                status=AuditActionStatus.FAILURE,
                details={"reason": f"Account status is {user.status}", "email": email}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive or suspended"
            )

        # Update last login time
        now = datetime.now(timezone.utc)
        self.user_repo.update_last_login(user.id, now)

        # Get Role and Permissions
        role_name = user.role.name if user.role else "EMPLOYEE"
        permissions = self.user_repo.get_user_permissions(user.id)

        # Generate JWT tokens
        access_token = create_access_token(
            subject=str(user.id),
            company_id=str(user.company_id),
            role=role_name
        )
        refresh_token_str = create_refresh_token(subject=str(user.id))

        # Store Session & Refresh Token in DB
        session_expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        self.auth_repo.create_session(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=session_expires
        )

        self.auth_repo.create_refresh_token(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=refresh_expires
        )

        # Log Audit Event
        self.auth_repo.log_audit_event(
            company_id=user.company_id,
            user_id=user.id,
            action="LOGIN_SUCCESS",
            resource_type="AUTH",
            ip_address=ip_address,
            user_agent=user_agent,
            status=AuditActionStatus.SUCCESS,
            details={"email": email, "role": role_name}
        )

        user_summary = UserSummary(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            company_id=str(user.company_id),
            company_name=user.company.name if user.company else None,
            role=role_name,
            permissions=permissions
        )

        return LoginResponseData(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            user=user_summary
        )

    def refresh_access_token(
        self,
        refresh_token_str: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> RefreshTokenResponseData:
        try:
            payload = decode_jwt(refresh_token_str, secret_key=settings.JWT_REFRESH_SECRET_KEY)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            user_id_str = payload.get("sub")
            user_id = uuid.UUID(user_id_str)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        db_token = self.auth_repo.get_refresh_token(refresh_token_str)
        if not db_token or db_token.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked or does not exist"
            )

        user = self.user_repo.get_by_id(user_id)
        if not user or user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive or not found"
            )

        # Revoke old refresh token (Token rotation)
        self.auth_repo.revoke_refresh_token(refresh_token_str)

        # Create new pair
        role_name = user.role.name if user.role else "EMPLOYEE"
        now = datetime.now(timezone.utc)
        
        new_access_token = create_access_token(
            subject=str(user.id),
            company_id=str(user.company_id),
            role=role_name
        )
        new_refresh_token_str = create_refresh_token(subject=str(user.id))

        refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.auth_repo.create_refresh_token(
            user_id=user.id,
            token=new_refresh_token_str,
            expires_at=refresh_expires
        )

        self.auth_repo.log_audit_event(
            company_id=user.company_id,
            user_id=user.id,
            action="TOKEN_REFRESH",
            resource_type="AUTH",
            ip_address=ip_address,
            user_agent=user_agent,
            status=AuditActionStatus.SUCCESS
        )

        return RefreshTokenResponseData(
            access_token=new_access_token,
            refresh_token=new_refresh_token_str,
            token_type="bearer"
        )

    def logout(
        self,
        current_user_id: uuid.UUID,
        company_id: uuid.UUID,
        refresh_token_str: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        if refresh_token_str:
            self.auth_repo.revoke_refresh_token(refresh_token_str)
        else:
            self.auth_repo.revoke_all_user_refresh_tokens(current_user_id)

        self.auth_repo.deactivate_user_sessions(current_user_id)

        self.auth_repo.log_audit_event(
            company_id=company_id,
            user_id=current_user_id,
            action="LOGOUT",
            resource_type="AUTH",
            ip_address=ip_address,
            user_agent=user_agent,
            status=AuditActionStatus.SUCCESS
        )

    def get_me(self, user_id: uuid.UUID) -> UserMeResponseData:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        role_name = user.role.name if user.role else "EMPLOYEE"
        permissions = self.user_repo.get_user_permissions(user.id)

        return UserMeResponseData(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=(user.status == UserStatus.ACTIVE),
            company_id=str(user.company_id),
            company_name=user.company.name if user.company else None,
            role=role_name,
            permissions=permissions
        )
