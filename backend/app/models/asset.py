import uuid
from typing import List, Optional
from sqlalchemy import String, Enum, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel
from app.models.enums import AssetType, EnvironmentType

class Asset(BaseModel):
    """
    Asset owned by an SME (Website, API, Application, Subdomain, IPAddress).
    """
    __tablename__ = "assets"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[AssetType] = mapped_column(
        Enum(AssetType, name="asset_type_enum"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hostname: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    protocol: Mapped[Optional[str]] = mapped_column(String(20), default="https", nullable=True)
    port: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    environment: Mapped[EnvironmentType] = mapped_column(
        Enum(EnvironmentType, name="environment_type_enum"),
        default=EnvironmentType.PRODUCTION,
        nullable=False
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="assets")
    targets: Mapped[List["Target"]] = relationship("Target", back_populates="asset", cascade="all, delete-orphan")
