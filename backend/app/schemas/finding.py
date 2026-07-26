import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class FindingRead(BaseModel):
    id: uuid.UUID
    scan_job_id: uuid.UUID
    tool_execution_id: Optional[uuid.UUID] = None
    scanner_name: str
    title: str
    severity: Optional[str] = None
    description: Optional[str] = None
    http_request: Optional[str] = None
    http_response: Optional[str] = None
    evidence_notes: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
