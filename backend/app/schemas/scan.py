import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.models.enums import ScanStatus, ToolType, ToolExecutionStatus

class ScanCreate(BaseModel):
    target_id: uuid.UUID
    tools: List[str] = Field(default_factory=lambda: ["zap", "nmap", "nikto"])
    owasp: Optional[List[str]] = Field(default_factory=lambda: ["A01", "A03", "A05"])

class ToolExecutionRead(BaseModel):
    id: uuid.UUID
    scan_job_id: uuid.UUID
    tool_type: ToolType
    status: ToolExecutionStatus
    progress: int
    return_code: Optional[int] = None
    logs: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ScanJobRead(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    target_id: uuid.UUID
    auditor_id: Optional[uuid.UUID] = None
    status: ScanStatus
    progress: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    tool_executions: List[ToolExecutionRead] = []
    findings_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ScanStatusRead(BaseModel):
    scan_id: uuid.UUID
    status: ScanStatus
    progress: int
    zap: str
    nmap: str
    nikto: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
