import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.dashboard import (
    AdminDashboardResponse,
    AuditorDashboardResponse,
    EmployeeDashboardResponse
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])

@router.get(
    "/admin",
    response_model=ApiResponse[AdminDashboardResponse],
    summary="Get Super Admin KPIs & metrics"
)
def get_admin_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    data = service.get_admin_dashboard(company_id=current_user.company_id)

    return ApiResponse(
        success=True,
        message="Super Admin metrics retrieved successfully.",
        data=data
    )

@router.get(
    "/auditor",
    response_model=ApiResponse[AuditorDashboardResponse],
    summary="Get Auditor KPIs & metrics"
)
def get_auditor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    data = service.get_auditor_dashboard(
        company_id=current_user.company_id,
        auditor_id=current_user.id
    )

    return ApiResponse(
        success=True,
        message="Auditor metrics retrieved successfully.",
        data=data
    )

@router.get(
    "/employee",
    response_model=ApiResponse[EmployeeDashboardResponse],
    summary="Get Employee KPIs & metrics"
)
def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    data = service.get_employee_dashboard(
        company_id=current_user.company_id,
        employee_id=current_user.id
    )

    return ApiResponse(
        success=True,
        message="Employee metrics retrieved successfully.",
        data=data
    )
