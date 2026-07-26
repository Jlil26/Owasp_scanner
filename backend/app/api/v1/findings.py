import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.finding import FindingRead
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.finding_service import FindingService

router = APIRouter(prefix="/findings", tags=["Findings & Evidence"])
finding_service = FindingService()

@router.get("", response_model=StandardResponse[PaginatedResponse[FindingRead]])
def list_findings(
    scan_job_id: Optional[uuid.UUID] = Query(None),
    tool_execution_id: Optional[uuid.UUID] = Query(None),
    scanner_name: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get raw security findings generated directly by scanner tools.
    Internal & Evidence Center query endpoint.
    """
    findings, total = finding_service.list_findings(
        db=db,
        current_user=current_user,
        scan_job_id=scan_job_id,
        tool_execution_id=tool_execution_id,
        scanner_name=scanner_name,
        page=page,
        size=size
    )
    items = [FindingRead.model_validate(f) for f in findings]
    return StandardResponse.success_response(
        data=PaginatedResponse.create(items=items, total=total, page=page, size=size),
        message="Raw findings list retrieved successfully."
    )

@router.get("/{id}", response_model=StandardResponse[FindingRead])
def get_finding_details(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed evidence for a single raw finding (HTTP request, response, evidence notes).
    """
    finding = finding_service.get_finding(db=db, current_user=current_user, finding_id=id)
    return StandardResponse.success_response(
        data=FindingRead.model_validate(finding),
        message="Finding evidence details retrieved successfully."
    )
