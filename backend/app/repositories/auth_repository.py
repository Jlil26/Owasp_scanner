import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, update

from app.models.user import Session as UserSession, RefreshToken
from app.models.audit import AuditLog
from app.models.enums import AuditActionStatus

class AuthRepository:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def create_session(
        self,
        user_id: uuid.UUID,
        ip_address: Optional[str],
        user_agent: Optional[str],
        expires_at: datetime
    ) -> UserSession:
        session = UserSession(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
            expires_at=expires_at
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def deactivate_user_sessions(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.is_active == True)
            .values(is_active=False)
        )
        self.db.execute(stmt)
        self.db.commit()

    def create_refresh_token(
        self,
        user_id: uuid.UUID,
        token: str,
        expires_at: datetime
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            is_revoked=False,
            expires_at=expires_at
        )
        self.db.add(refresh_token)
        self.db.commit()
        self.db.refresh(refresh_token)
        return refresh_token

    def get_refresh_token(self, token: str) -> Optional[RefreshToken]:
        stmt = (
            select(RefreshToken)
            .where(RefreshToken.token == token)
            .where(RefreshToken.is_revoked == False)
        )
        return self.db.execute(stmt).scalars().first()

    def revoke_refresh_token(self, token: str) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token == token)
            .values(is_revoked=True)
        )
        self.db.execute(stmt)
        self.db.commit()

    def revoke_all_user_refresh_tokens(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .where(RefreshToken.is_revoked == False)
            .values(is_revoked=True)
        )
        self.db.execute(stmt)
        self.db.commit()

    def log_audit_event(
        self,
        company_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        action: str,
        resource_type: str = "AUTH",
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: AuditActionStatus = AuditActionStatus.SUCCESS,
        details: Optional[dict] = None
    ) -> AuditLog:
        audit_log = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=None,
            new_value=details,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status
        )
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        return audit_log
