import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from app.services.attachment_service import AttachmentService

router = APIRouter(prefix="/attachments", tags=["File Attachments & Proof Evidences"])

@router.post("/upload", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    resource_type: str = Query(..., description="'vulnerability', 'report', or 'thread'"),
    resource_id: uuid.UUID = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    svc = AttachmentService(db)
    attachment = svc.upload_attachment(
        company_id=current_user.company_id,
        uploader_id=current_user.id,
        resource_type=resource_type,
        resource_id=resource_id,
        file=file,
        file_bytes=content
    )
    return AttachmentResponse(
        id=attachment.id,
        company_id=attachment.company_id,
        uploader_id=attachment.uploader_id,
        uploader_name=f"{current_user.first_name} {current_user.last_name}",
        resource_type=attachment.resource_type,
        resource_id=attachment.resource_id,
        filename=attachment.filename,
        file_type=attachment.file_type,
        file_size=attachment.file_size,
        file_path=attachment.file_path,
        sha256_hash=attachment.sha256_hash,
        created_at=attachment.created_at
    )

@router.get("", response_model=List[AttachmentResponse])
def list_attachments(
    resource_type: str = Query(...),
    resource_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = AttachmentService(db)
    atts = svc.list_attachments_for_resource(
        company_id=current_user.company_id,
        resource_type=resource_type,
        resource_id=resource_id
    )
    return [
        AttachmentResponse(
            id=a.id,
            company_id=a.company_id,
            uploader_id=a.uploader_id,
            uploader_name=f"{a.uploader.first_name} {a.uploader.last_name}" if a.uploader else "User",
            resource_type=a.resource_type,
            resource_id=a.resource_id,
            filename=a.filename,
            file_type=a.file_type,
            file_size=a.file_size,
            file_path=a.file_path,
            sha256_hash=a.sha256_hash,
            created_at=a.created_at
        ) for a in atts
    ]

@router.get("/{attachment_id}/download")
def download_attachment(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = AttachmentService(db)
    att = svc.get_attachment(attachment_id, current_user.company_id)
    return FileResponse(
        path=att.file_path,
        filename=att.filename,
        media_type=att.file_type
    )

@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = AttachmentService(db)
    svc.delete_attachment(attachment_id, current_user.id, current_user.company_id)
