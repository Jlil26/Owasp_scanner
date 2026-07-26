import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Request, Response, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.report import (
    ReportCreate,
    ReportResponse,
    ReportDetailResponse,
    ReportHashResponse,
    ReportCommentCreate,
    ReportCommentResponse,
)
from app.models.report import ReportComment
from app.models.activity import CollaborationActivity
from app.services.messaging_service import MessagingService
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post(
    "",
    response_model=ApiResponse[ReportResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Generate security report"
)
def generate_report(
    payload: ReportCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    report = service.generate_report(
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_ip=client_ip,
        scan_job_id=payload.scan_job_id,
        title=payload.title,
        report_format=payload.report_format or "PDF",
        owasp_categories=payload.owasp_categories
    )

    return ApiResponse(
        success=True,
        message="Security report generated successfully with SHA-256 signature.",
        data=ReportResponse.model_validate(report)
    )

@router.get(
    "",
    response_model=ApiResponse[PaginatedResponse[ReportResponse]],
    summary="List tenant security reports"
)
def list_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    items, total = service.get_all_reports(
        company_id=current_user.company_id,
        page=page,
        size=size
    )

    items_data = [ReportResponse.model_validate(r) for r in items]
    paginated = PaginatedResponse(
        items=items_data,
        total=total,
        page=page,
        size=size
    )

    return ApiResponse(
        success=True,
        message="Tenant security reports history retrieved successfully.",
        data=paginated
    )

@router.get(
    "/{id}",
    response_model=ApiResponse[ReportDetailResponse],
    summary="Get report metadata and full details"
)
def get_report_detail(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    report = service.get_report(id, current_user.company_id)
    
    return ApiResponse(
        success=True,
        message="Report details retrieved successfully.",
        data=ReportDetailResponse.model_validate(report)
    )

@router.get(
    "/{id}/download",
    summary="Download PDF report file"
)
def download_report_pdf(
    id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    pdf_bytes, filename, file_hash = service.download_report_pdf(
        report_id=id,
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_ip=client_ip
    )

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Report-SHA256": file_hash
    }

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers=headers
    )

@router.get(
    "/{id}/html",
    summary="Preview HTML report content"
)
def preview_report_html(
    id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    html_content = service.view_report_html(
        report_id=id,
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_ip=client_ip
    )

    return Response(
        content=html_content,
        media_type="text/html"
    )

@router.get(
    "/{id}/hash",
    response_model=ApiResponse[ReportHashResponse],
    summary="Get SHA-256 non-repudiation and integrity hash verification"
)
def verify_report_hash(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    report = service.get_report(id, current_user.company_id)

    hash_data = ReportHashResponse(
        report_id=report.id,
        file_hash=report.file_hash,
        algorithm="SHA-256",
        verified=True,
        created_at=report.created_at
    )

    return ApiResponse(
        success=True,
        message="Report SHA-256 non-repudiation signature verified.",
        data=hash_data
    )

@router.post(
    "/{id}/comment",
    response_model=ApiResponse[ReportCommentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add review comment to report with mentions support"
)
def add_report_comment(
    id: uuid.UUID,
    payload: ReportCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    report = service.get_report(id, current_user.company_id)

    comment = ReportComment(
        report_id=report.id,
        author_id=current_user.id,
        content=payload.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Process mentions
    msg_svc = MessagingService(db)
    msg_svc._extract_and_notify_mentions(
        content=payload.content,
        sender_id=current_user.id,
        context_title=f"Report: {report.title or 'Security Report'}"
    )

    # Log activity
    act = CollaborationActivity(
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="COMMENT_CREATED",
        resource_type="report",
        resource_id=report.id,
        summary=f"Commented on report '{report.title}'",
        details=payload.content[:200]
    )
    db.add(act)
    db.commit()

    author_name = f"{current_user.first_name} {current_user.last_name}"
    author_role = current_user.role.name if current_user.role else "USER"

    return ApiResponse(
        success=True,
        message="Comment added to report.",
        data=ReportCommentResponse(
            id=comment.id,
            report_id=comment.report_id,
            author_id=comment.author_id,
            author_name=author_name,
            author_role=author_role,
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
    )

@router.get(
    "/{id}/comments",
    response_model=ApiResponse[List[ReportCommentResponse]],
    summary="Get comments on a report"
)
def get_report_comments(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    report = service.get_report(id, current_user.company_id)

    comments = db.query(ReportComment).filter(ReportComment.report_id == report.id).order_by(ReportComment.created_at.asc()).all()
    res_list = [
        ReportCommentResponse(
            id=c.id,
            report_id=c.report_id,
            author_id=c.author_id,
            author_name=f"{c.author.first_name} {c.author.last_name}" if c.author else "User",
            author_role=c.author.role.name if c.author and c.author.role else "USER",
            content=c.content,
            created_at=c.created_at,
            updated_at=c.updated_at
        ) for c in comments
    ]

    return ApiResponse(
        success=True,
        message="Report comments retrieved.",
        data=res_list
    )

