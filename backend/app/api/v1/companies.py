import uuid
from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.services.company_service import CompanyService
from app.schemas.company import CompanyUpdate, CompanyResponse
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get(
    "",
    response_model=StandardResponse[List[CompanyResponse]],
    summary="List company for current tenant"
)
def list_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    result = service.list_companies(current_user=current_user)
    return StandardResponse(
        success=True,
        message="Companies retrieved successfully",
        data=result
    )

@router.get(
    "/{id}",
    response_model=StandardResponse[CompanyResponse],
    summary="Get details of a company"
)
def get_company(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    result = service.get_company(company_id=id, current_user=current_user)
    return StandardResponse(
        success=True,
        message="Company details retrieved",
        data=result
    )

@router.patch(
    "/{id}",
    response_model=StandardResponse[CompanyResponse],
    summary="Update company details (Super Admin only)"
)
def update_company(
    id: uuid.UUID,
    request: Request,
    body: CompanyUpdate,
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = CompanyService(db)
    result = service.update_company(
        company_id=id,
        obj_in=body,
        current_user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    return StandardResponse(
        success=True,
        message="Company updated successfully",
        data=result
    )
