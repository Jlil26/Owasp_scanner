import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Enum, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel
from app.models.enums import ScanStatus, ToolType, ToolExecutionStatus

class ScanJob(BaseModel):
    """
    Scan Job orchestrating security tools against a Target.
    """
    __tablename__ = "scan_jobs"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    auditor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[ScanStatus] = mapped_column(
        Enum(ScanStatus, name="scan_status_enum"),
        default=ScanStatus.PENDING,
        nullable=False,
        index=True
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="scan_jobs")
    target: Mapped["Target"] = relationship("Target", back_populates="scan_jobs")
    auditor: Mapped[Optional["User"]] = relationship("User")
    tool_executions: Mapped[List["ToolExecution"]] = relationship(
        "ToolExecution", back_populates="scan_job", cascade="all, delete-orphan"
    )
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="scan_job", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="scan_job", cascade="all, delete-orphan")

class ToolExecution(BaseModel):
    """
    Individual execution state, logs, and progress for a scanner tool (ZAP, Nmap, Nikto) inside a ScanJob.
    """
    __tablename__ = "tool_executions"

    scan_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scan_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tool_type: Mapped[ToolType] = mapped_column(
        Enum(ToolType, name="tool_type_enum"),
        nullable=False
    )
    status: Mapped[ToolExecutionStatus] = mapped_column(
        Enum(ToolExecutionStatus, name="tool_execution_status_enum"),
        default=ToolExecutionStatus.PENDING,
        nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    return_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    logs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    scan_job: Mapped["ScanJob"] = relationship("ScanJob", back_populates="tool_executions")
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="tool_execution", cascade="all, delete-orphan")
