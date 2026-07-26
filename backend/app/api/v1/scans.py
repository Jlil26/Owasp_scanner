import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.scan import ScanCreate, ScanJobRead, ScanStatusRead
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.scan_service import ScanService

router = APIRouter(prefix="/scans", tags=["Scanner Engine"])
scan_service = ScanService()

@router.post("", response_model=StandardResponse[ScanJobRead], status_code=status.HTTP_201_CREATED)
def create_scan(
    payload: ScanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Launch a new vulnerability scan for a target using ZAP, Nmap, Nikto.
    Auditors only.
    """
    scan_job = scan_service.launch_scan(db=db, current_user=current_user, payload=payload)
    return StandardResponse.success_response(
        data=ScanJobRead.model_validate(scan_job),
        message="Scan job created and execution triggered successfully."
    )

@router.get("", response_model=StandardResponse[PaginatedResponse[ScanJobRead]])
def list_scans(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get scan history filtered by tenant company and auditor RBAC permissions.
    """
    scans, total = scan_service.list_scans(db=db, current_user=current_user, page=page, size=size)
    items = [ScanJobRead.model_validate(s) for s in scans]
    return StandardResponse.success_response(
        data=PaginatedResponse.create(items=items, total=total, page=page, size=size),
        message="Scan history retrieved successfully."
    )

@router.get("/{id}", response_model=StandardResponse[ScanJobRead])
def get_scan_details(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed scan job status including sub-task tool executions and findings count.
    """
    scan_job = scan_service.get_scan(db=db, current_user=current_user, scan_id=id)
    return StandardResponse.success_response(
        data=ScanJobRead.model_validate(scan_job),
        message="Scan job details retrieved successfully."
    )

@router.get("/{id}/status", response_model=StandardResponse[dict])
def get_scan_status(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get real-time progress and individual tool statuses for auditor progress bar.
    """
    status_data = scan_service.get_scan_status(db=db, current_user=current_user, scan_id=id)
    return StandardResponse.success_response(
        data=status_data,
        message="Scan progress status retrieved successfully."
    )

@router.post("/{id}/cancel", response_model=StandardResponse[ScanJobRead])
def cancel_scan(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an active scan job and halt running workers.
    """
    updated_job = scan_service.cancel_scan(db=db, current_user=current_user, scan_id=id)
    return StandardResponse.success_response(
        data=ScanJobRead.model_validate(updated_job),
        message="Scan job cancelled successfully."
    )
