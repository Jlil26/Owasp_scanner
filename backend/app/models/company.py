import uuid
from typing import List, Optional
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import CompanyStatus

class Company(BaseModel):
    """
    Represents an SME (PME) or Tenant in the multi-tenant OWASP_SCAN_PRO platform.
    """
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[CompanyStatus] = mapped_column(
        Enum(CompanyStatus, name="company_status_enum"),
        default=CompanyStatus.ACTIVE,
        nullable=False
    )

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="company", cascade="all, delete-orphan")
    assets: Mapped[List["Asset"]] = relationship("Asset", back_populates="company", cascade="all, delete-orphan")
    targets: Mapped[List["Target"]] = relationship("Target", back_populates="company", cascade="all, delete-orphan")
    scan_jobs: Mapped[List["ScanJob"]] = relationship("ScanJob", back_populates="company", cascade="all, delete-orphan")
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship("Vulnerability", back_populates="company", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="company", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="company", cascade="all, delete-orphan")
    settings: Mapped[List["Setting"]] = relationship("Setting", back_populates="company", cascade="all, delete-orphan")
