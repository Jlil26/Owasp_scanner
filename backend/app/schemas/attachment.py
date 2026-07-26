from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
import uuid

class AttachmentResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    uploader_id: uuid.UUID
    uploader_name: Optional[str] = None
    resource_type: str
    resource_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    file_path: str
    sha256_hash: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
