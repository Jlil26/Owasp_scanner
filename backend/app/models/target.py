import uuid
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

class Target(BaseModel):
    """
    Authorized scanning target derived from an Asset and assigned to an Auditor.
    """
    __tablename__ = "targets"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    auditor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="targets")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="targets")
    auditor: Mapped[Optional["User"]] = relationship("User", back_populates="assigned_targets")
    scan_jobs: Mapped[List["ScanJob"]] = relationship("ScanJob", back_populates="target", cascade="all, delete-orphan")
