import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, update

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate

class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, company_id: uuid.UUID) -> Optional[Company]:
        stmt = select(Company).where(Company.id == company_id).where(Company.deleted_at.is_(None))
        return self.db.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Company]:
        stmt = select(Company).where(Company.deleted_at.is_(None)).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, obj_in: CompanyCreate) -> Company:
        db_obj = Company(
            name=obj_in.name,
            legal_name=obj_in.legal_name,
            email=obj_in.email,
            phone=obj_in.phone,
            country=obj_in.country
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Company, obj_in: CompanyUpdate) -> Company:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
