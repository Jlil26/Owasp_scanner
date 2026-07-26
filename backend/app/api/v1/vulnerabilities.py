import uuid
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status, Query, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.enums import VulnerabilityStatus, VulnerabilitySeverity
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.vulnerability import (
    VulnerabilityCreate,
    VulnerabilityResponse,
    VulnerabilityDetailResponse,
    VulnerabilityAssignPayload,
    VulnerabilityStatusUpdatePayload,
    VulnerabilityCommentCreate,
    VulnerabilityCommentResponse,
    VulnerabilityHistoryResponse,
    RemediationPolicySetting
)
from app.services.vulnerability_service import VulnerabilityService, DEFAULT_SLA_DAYS

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])

def map_vuln_response(vuln) -> VulnerabilityResponse:
    now = datetime.now(timezone.utc)
    is_overdue = bool(
        vuln.due_date and vuln.due_date < now and vuln.status not in [VulnerabilityStatus.VERIFIED, VulnerabilityStatus.CLOSED]
    )

    assigned_name = None
    assigned_id = None
    if vuln.assignments and len(vuln.assignments) > 0:
        latest = vuln.assignments[-1]
        assigned_id = latest.assigned_to_user_id
        if latest.assigned_to_user:
            assigned_name = f"{latest.assigned_to_user.first_name} {latest.assigned_to_user.last_name}"

    return VulnerabilityResponse(
        id=vuln.id,
        company_id=vuln.company_id,
        finding_id=vuln.finding_id,
        title=vuln.title,
        severity=vuln.severity,
        cvss=vuln.cvss,
        cwe=vuln.cwe,
        owasp_category=vuln.owasp_category,
        status=vuln.status,
        due_date=vuln.due_date,
        remediation_sla_days=vuln.remediation_sla_days,
        is_overdue=is_overdue,
        assigned_employee_name=assigned_name,
        assigned_employee_id=assigned_id,
        created_at=vuln.created_at,
        updated_at=vuln.updated_at
    )

@router.get(
    "",
    response_model=ApiResponse[PaginatedResponse[VulnerabilityResponse]],
    summary="List tenant vulnerabilities with filters and pagination"
)
def list_vulnerabilities(
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, HIGH, etc.)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (NEW, ASSIGNED, etc.)"),
    employee_id: Optional[uuid.UUID] = Query(None, description="Filter by assigned employee"),
    owasp_category: Optional[str] = Query(None, description="Filter by OWASP Top 10 category"),
    q: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = VulnerabilityService(db)
    items, total = service.list_vulnerabilities(
        company_id=current_user.company_id,
        severity=severity,
        status=status_filter,
        employee_id=employee_id,
        owasp_category=owasp_category,
        search_q=q,
        page=page,
        size=size
    )

    resp_items = [map_vuln_response(v) for v in items]
    paginated = PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        size=size
    )

    return ApiResponse(
        success=True,
        message="Vulnerabilities retrieved successfully.",
        data=paginated
    )

@router.post(
    "",
    response_model=ApiResponse[VulnerabilityResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create or synthesize vulnerability manually or from findings"
)
def create_vulnerability(
    payload: VulnerabilityCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = VulnerabilityService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"

    vuln = service.create_vulnerability(
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_ip=client_ip,
        title=payload.title,
        severity=payload.severity,
        cvss=payload.cvss,
        cwe=payload.cwe,
        owasp_category=payload.owasp_category,
        description=payload.description,
        recommendation=payload.recommendation,
        finding_id=payload.finding_id
    )

    return ApiResponse(
        success=True,
        message="Vulnerability created successfully.",
        data=map_vuln_response(vuln)
    )

@router.get(
    "/{id}",
    response_model=ApiResponse[VulnerabilityDetailResponse],
    summary="Get detailed vulnerability view"
)
def get_vulnerability_detail(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = VulnerabilityService(db)
    vuln = service.get_vulnerability(id, current_user.company_id)

    comments_resp = []
    for c in vuln.comments:
        author_name = f"{c.author.first_name} {c.author.last_name}" if c.author else "User"
        author_role = c.author.role.name if (c.author and c.author.role) else "USER"
        comments_resp.append(VulnerabilityCommentResponse(
            id=c.id,
            vulnerability_id=c.vulnerability_id,
            author_id=c.author_id,
            author_name=author_name,
            author_role=author_role,
            content=c.content,
            created_at=c.created_at
        ))

    history_resp = []
    for h in vuln.history:
        changed_name = f"{h.changed_by_user.first_name} {h.changed_by_user.last_name}" if h.changed_by_user else "System"
        history_resp.append(VulnerabilityHistoryResponse(
            id=h.id,
            vulnerability_id=h.vulnerability_id,
            changed_by_user_id=h.changed_by_user_id,
            changed_by_name=changed_name,
            old_status=h.old_status,
            new_status=h.new_status,
            change_summary=h.change_summary,
            created_at=h.created_at
        ))

    base_resp = map_vuln_response(vuln)
    detail = VulnerabilityDetailResponse(
        **base_resp.model_dump(),
        description=vuln.description,
        recommendation=vuln.recommendation,
        comments=comments_resp,
        history=history_resp
    )

    return ApiResponse(
        success=True,
        message="Vulnerability detail retrieved successfully.",
        data=detail
    )

@router.patch(
    "/{id}",
    response_model=ApiResponse[VulnerabilityResponse],
    summary="Update vulnerability remediation status"
)
def update_vulnerability_status(
    id: uuid.UUID,
    payload: VulnerabilityStatusUpdatePayload,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = VulnerabilityService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"

    updated = service.update_status(
        vulnerability_id=id,
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_ip=client_ip,
        new_status=payload.status,
        summary=payload.summary
    )

    return ApiResponse(
        success=True,
        message=f"Vulnerability status updated to {payload.status.value}.",
        data=map_vuln_response(updated)
    )

@router.post(
    "/{id}/assign",
    response_model=ApiResponse[VulnerabilityResponse],
    summary="Assign vulnerability remediation task to employee"
)
def assign_vulnerability_task(
    id: uuid.UUID,
    payload: VulnerabilityAssignPayload,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = VulnerabilityService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"

    service.assign_employee(
        vulnerability_id=id,
        company_id=current_user.company_id,
        assigned_by_user_id=current_user.id,
        assigned_to_user_id=payload.employee_id,
        user_ip=client_ip,
        notes=payload.notes
    )

    updated_vuln = service.get_vulnerability(id, current_user.company_id)

    return ApiResponse(
        success=True,
        message="Vulnerability remediation task assigned successfully.",
        data=map_vuln_response(updated_vuln)
    )

@router.post(
    "/{id}/comment",
    response_model=ApiResponse[VulnerabilityCommentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add comment or discussion entry to vulnerability"
)
def add_vulnerability_comment(
    id: uuid.UUID,
    payload: VulnerabilityCommentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = VulnerabilityService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"

    comment = service.add_comment(
        vulnerability_id=id,
        company_id=current_user.company_id,
        author_id=current_user.id,
        user_ip=client_ip,
        content=payload.content
    )

    author_name = f"{current_user.first_name} {current_user.last_name}"
    author_role = current_user.role.name if current_user.role else "USER"

    resp = VulnerabilityCommentResponse(
        id=comment.id,
        vulnerability_id=comment.vulnerability_id,
        author_id=comment.author_id,
        author_name=author_name,
        author_role=author_role,
        content=comment.content,
        created_at=comment.created_at
    )

    return ApiResponse(
        success=True,
        message="Comment added successfully.",
        data=resp
    )

@router.get(
    "/remediation-policies/default",
    response_model=ApiResponse[RemediationPolicySetting],
    summary="Get default remediation SLA policy"
)
def get_remediation_policy():
    policy = RemediationPolicySetting(
        critical_sla_days=DEFAULT_SLA_DAYS[VulnerabilitySeverity.CRITICAL],
        high_sla_days=DEFAULT_SLA_DAYS[VulnerabilitySeverity.HIGH],
        medium_sla_days=DEFAULT_SLA_DAYS[VulnerabilitySeverity.MEDIUM],
        low_sla_days=DEFAULT_SLA_DAYS[VulnerabilitySeverity.LOW],
        info_sla_days=DEFAULT_SLA_DAYS[VulnerabilitySeverity.INFO]
    )
    return ApiResponse(
        success=True,
        message="Remediation SLA policy configured.",
        data=policy
    )
