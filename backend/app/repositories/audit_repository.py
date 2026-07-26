import uuid
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.audit import AuditLog
from app.models.enums import AuditActionStatus

class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_logs(
        self,
        company_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        status: Optional[AuditActionStatus] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[AuditLog], int]:
        stmt = select(AuditLog).where(AuditLog.company_id == company_id)
        count_stmt = select(func.count(AuditLog.id)).where(AuditLog.company_id == company_id)

        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
            count_stmt = count_stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
            count_stmt = count_stmt.where(AuditLog.action.ilike(f"%{action}%"))
        if status:
            stmt = stmt.where(AuditLog.status == status)
            count_stmt = count_stmt.where(AuditLog.status == status)

        total = self.db.execute(count_stmt).scalar() or 0
        stmt = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())

        return items, total

    def log(
        self,
        company_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: AuditActionStatus = AuditActionStatus.SUCCESS
    ) -> AuditLog:
        log_item = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status
        )
        self.db.add(log_item)
        self.db.commit()
        self.db.refresh(log_item)
        return log_item
