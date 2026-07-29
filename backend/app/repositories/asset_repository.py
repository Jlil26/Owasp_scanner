import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, update

from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

class AssetRepository:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def get_by_id(self, asset_id: uuid.UUID, company_id: Optional[uuid.UUID] = None) -> Optional[Asset]:
        stmt = select(Asset).where(Asset.id == asset_id).where(Asset.deleted_at.is_(None))
        if company_id:
            stmt = stmt.where(Asset.company_id == company_id)
        return self.db.execute(stmt).scalars().first()

    def get_all_by_company(self, company_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Asset]:
        stmt = (
            select(Asset)
            .where(Asset.company_id == company_id)
            .where(Asset.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, company_id: uuid.UUID, obj_in: AssetCreate) -> Asset:
        db_obj = Asset(
            company_id=company_id,
            type=obj_in.type,
            name=obj_in.name,
            hostname=obj_in.hostname,
            ip=obj_in.ip,
            protocol=obj_in.protocol,
            port=obj_in.port,
            environment=obj_in.environment
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Asset, obj_in: AssetUpdate) -> Asset:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def soft_delete(self, asset_id: uuid.UUID, company_id: uuid.UUID) -> bool:
        stmt = (
            update(Asset)
            .where(Asset.id == asset_id)
            .where(Asset.company_id == company_id)
            .values(deleted_at=datetime.now(timezone.utc))
        )
        res = self.db.execute(stmt)
        self.db.commit()
        return res.rowcount > 0
