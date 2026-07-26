import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.company_repository import CompanyRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.models.user import User

class CompanyService:
    def __init__(self, db: Session):
        self.db = db
        self.company_repo = CompanyRepository(db)
        self.audit_repo = AuditRepository(db)

    def get_company(self, company_id: uuid.UUID, current_user: User) -> CompanyResponse:
        # Multi-tenant check: user can only see their company unless system wide override
        if current_user.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested company"
            )
        company = self.company_repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return CompanyResponse.model_validate(company)

    def list_companies(self, current_user: User, skip: int = 0, limit: int = 100) -> List[CompanyResponse]:
        # PME super admin only sees their own company
        company = self.company_repo.get_by_id(current_user.company_id)
        if not company:
            return []
        return [CompanyResponse.model_validate(company)]

    def update_company(
        self,
        company_id: uuid.UUID,
        obj_in: CompanyUpdate,
        current_user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> CompanyResponse:
        if current_user.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to update company"
            )

        company = self.company_repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        old_val = {"name": company.name, "email": company.email, "status": str(company.status)}
        updated = self.company_repo.update(company, obj_in)
        new_val = {"name": updated.name, "email": updated.email, "status": str(updated.status)}

        self.audit_repo.log(
            company_id=company_id,
            user_id=current_user.id,
            action="UPDATE_COMPANY",
            resource_type="COMPANY",
            resource_id=str(company_id),
            old_value=old_val,
            new_value=new_val,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return CompanyResponse.model_validate(updated)
