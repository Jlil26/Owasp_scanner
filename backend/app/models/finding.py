import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.models.base import BaseModel

class Finding(BaseModel):
    """
    Raw security finding produced directly by a scanner tool (ZAP, Nmap, Nikto).
    Evidence Center capabilities (HTTP request/response, raw data) are stored here for AI processing.
    """
    __tablename__ = "findings"

    scan_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scan_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tool_execution_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tool_executions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    scanner_name: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    http_request: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    http_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    scan_job: Mapped["ScanJob"] = relationship("ScanJob", back_populates="findings")
    tool_execution: Mapped[Optional["ToolExecution"]] = relationship("ToolExecution", back_populates="findings")
    vulnerabilities: Mapped[list["Vulnerability"]] = relationship("Vulnerability", back_populates="finding")
