import uuid
from typing import List, Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

class Thread(BaseModel):
    """
    Discussion thread attached to a Vulnerability.
    """
    __tablename__ = "threads"

    vulnerability_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vulnerabilities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    vulnerability: Mapped["Vulnerability"] = relationship("Vulnerability", back_populates="threads")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="thread", cascade="all, delete-orphan")

class Message(BaseModel):
    """
    Individual message sent within a discussion thread.
    """
    __tablename__ = "messages"

    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    thread: Mapped["Thread"] = relationship("Thread", back_populates="messages")
    sender: Mapped["User"] = relationship("User")
