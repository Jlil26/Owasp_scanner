import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TargetCreate(BaseModel):
    asset_id: uuid.UUID
    url: Optional[str] = None
    is_active: Optional[bool] = True

class TargetUpdate(BaseModel):
    url: Optional[str] = None
    is_active: Optional[bool] = None

class AssignAuditorRequest(BaseModel):
    auditor_id: uuid.UUID

class TargetResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    asset_id: uuid.UUID
    auditor_id: Optional[uuid.UUID] = None
    url: Optional[str] = None
    is_active: bool
    auditor_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
