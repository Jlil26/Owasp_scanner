from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
import uuid

class CollaborationActivityResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    resource_type: str
    resource_id: uuid.UUID
    summary: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
