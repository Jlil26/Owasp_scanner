import uuid
import hashlib
import os
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.models.attachment import Attachment
from app.models.user import User
from app.models.activity import CollaborationActivity
from app.models.enums import NotificationType
from app.services.notification_service import NotificationService

ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf", "text/plain", "text/x-log", "application/json",
    "application/x-pcap", "application/octet-stream", "text/csv"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

class AttachmentService:
    def __init__(self, db: Session):
        self.db = db
        self.notif_svc = NotificationService(db)

    def upload_attachment(
        self,
        company_id: uuid.UUID,
        uploader_id: uuid.UUID,
        resource_type: str,  # 'vulnerability', 'report', 'thread'
        resource_id: uuid.UUID,
        file: UploadFile,
        file_bytes: bytes
    ) -> Attachment:
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of 10MB ({len(file_bytes)} bytes)"
            )

        # Calculate SHA-256 for security non-repudiation
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # Save to upload dir
        upload_dir = os.path.join(os.getcwd(), "uploads", str(company_id))
        os.makedirs(upload_dir, exist_ok=True)
        safe_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(upload_dir, safe_filename)

        with open(file_path, "wb") as f:
            file_f = f.write(file_bytes)

        attachment = Attachment(
            company_id=company_id,
            uploader_id=uploader_id,
            resource_type=resource_type,
            resource_id=resource_id,
            filename=file.filename or "file",
            file_type=file.content_type or "application/octet-stream",
            file_size=len(file_bytes),
            file_path=file_path,
            sha256_hash=sha256_hash
        )
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)

        uploader = self.db.query(User).filter(User.id == uploader_id).first()
        uploader_name = f"{uploader.first_name} {uploader.last_name}" if uploader else "User"

        # Log Activity
        act = CollaborationActivity(
            company_id=company_id,
            user_id=uploader_id,
            action="ATTACHMENT_UPLOADED",
            resource_type=resource_type,
            resource_id=resource_id,
            summary=f"Uploaded proof file: {attachment.filename} ({len(file_bytes)} B, SHA256: {sha256_hash[:8]}...)",
            details=f"MIME: {attachment.file_type} • Hash: {sha256_hash}"
        )
        self.db.add(act)
        self.db.commit()

        return attachment

    def list_attachments_for_resource(self, company_id: uuid.UUID, resource_type: str, resource_id: uuid.UUID) -> List[Attachment]:
        return (
            self.db.query(Attachment)
            .filter(
                Attachment.company_id == company_id,
                Attachment.resource_type == resource_type,
                Attachment.resource_id == resource_id
            )
            .order_by(Attachment.created_at.desc())
            .all()
        )

    def get_attachment(self, attachment_id: uuid.UUID, company_id: uuid.UUID) -> Attachment:
        att = self.db.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.company_id == company_id
        ).first()
        if not att:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
        return att

    def delete_attachment(self, attachment_id: uuid.UUID, user_id: uuid.UUID, company_id: uuid.UUID) -> bool:
        att = self.get_attachment(attachment_id, company_id)
        self.db.delete(att)
        self.db.commit()

        # Log Activity
        act = CollaborationActivity(
            company_id=company_id,
            user_id=user_id,
            action="ATTACHMENT_DELETED",
            resource_type=att.resource_type,
            resource_id=att.resource_id,
            summary=f"Deleted attachment: {att.filename}"
        )
        self.db.add(act)
        self.db.commit()
        return True
