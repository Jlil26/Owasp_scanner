import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import AssetType, EnvironmentType

class AssetCreate(BaseModel):
    type: AssetType
    name: str
    hostname: Optional[str] = None
    ip: Optional[str] = None
    protocol: Optional[str] = "https"
    port: Optional[int] = None
    environment: Optional[EnvironmentType] = EnvironmentType.PRODUCTION

class AssetUpdate(BaseModel):
    type: Optional[AssetType] = None
    name: Optional[str] = None
    hostname: Optional[str] = None
    ip: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[int] = None
    environment: Optional[EnvironmentType] = None

class AssetResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    type: AssetType
    name: str
    hostname: Optional[str] = None
    ip: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[int] = None
    environment: EnvironmentType
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
