import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, update

from app.models.target import Target
from app.schemas.target import TargetCreate, TargetUpdate

class TargetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, target_id: uuid.UUID, company_id: Optional[uuid.UUID] = None) -> Optional[Target]:
        stmt = (
            select(Target)
            .options(joinedload(Target.auditor), joinedload(Target.asset))
            .where(Target.id == target_id)
            .where(Target.deleted_at.is_(None))
        )
        if company_id:
            stmt = stmt.where(Target.company_id == company_id)
        return self.db.execute(stmt).scalars().first()

    def get_all_by_company(
        self,
        company_id: uuid.UUID,
        auditor_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Target]:
        stmt = (
            select(Target)
            .options(joinedload(Target.auditor), joinedload(Target.asset))
            .where(Target.company_id == company_id)
            .where(Target.deleted_at.is_(None))
        )
        if auditor_id:
            stmt = stmt.where(Target.auditor_id == auditor_id)
            
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().unique().all())

    def create(self, company_id: uuid.UUID, obj_in: TargetCreate) -> Target:
        db_obj = Target(
            company_id=company_id,
            asset_id=obj_in.asset_id,
            url=obj_in.url,
            is_active=obj_in.is_active if obj_in.is_active is not None else True
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Target, obj_in: TargetUpdate) -> Target:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def assign_auditor(self, target_id: uuid.UUID, company_id: uuid.UUID, auditor_id: Optional[uuid.UUID]) -> Optional[Target]:
        stmt = (
            update(Target)
            .where(Target.id == target_id)
            .where(Target.company_id == company_id)
            .where(Target.deleted_at.is_(None))
            .values(auditor_id=auditor_id)
        )
        self.db.execute(stmt)
        self.db.commit()
        return self.get_by_id(target_id, company_id)

    def soft_delete(self, target_id: uuid.UUID, company_id: uuid.UUID) -> bool:
        stmt = (
            update(Target)
            .where(Target.id == target_id)
            .where(Target.company_id == company_id)
            .values(deleted_at=datetime.now(timezone.utc))
        )
        res = self.db.execute(stmt)
        self.db.commit()
        return res.rowcount > 0
