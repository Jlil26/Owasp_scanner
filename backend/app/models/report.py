import uuid
from typing import Optional, List
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

class Report(BaseModel):
    """
    Generated audit and vulnerability report linked to a ScanJob.
    SHA-256 hash guarantees non-repudiation and integrity.
    """
    __tablename__ = "reports"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scan_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scan_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    report_format: Mapped[str] = mapped_column(String(50), default="PDF", nullable=False)
    owasp_category: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    html_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    json_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="reports")
    scan_job: Mapped["ScanJob"] = relationship("ScanJob", back_populates="reports")
    comments: Mapped[List["ReportComment"]] = relationship(
        "ReportComment", back_populates="report", cascade="all, delete-orphan"
    )

class ReportComment(BaseModel):
    """
    Comments & review discussions attached to generated audit reports.
    """
    __tablename__ = "report_comments"

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    report: Mapped["Report"] = relationship("Report", back_populates="comments")
    author: Mapped["User"] = relationship("User")
