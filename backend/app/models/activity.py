import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

class CollaborationActivity(BaseModel):
    """
    Unified collaboration journal & activity log for vulnerabilities, reports, messaging and mentions.
    """
    __tablename__ = "collaboration_activities"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'COMMENT_CREATED', 'MENTION_TRIGGERED', 'ATTACHMENT_UPLOADED', 'THREAD_CREATED', 'MESSAGE_SENT'
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # 'vulnerability', 'report', 'thread'
    resource_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company")
    user: Mapped["User"] = relationship("User")
