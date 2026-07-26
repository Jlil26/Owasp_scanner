import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ReportCreate(BaseModel):
    scan_job_id: uuid.UUID
    title: Optional[str] = "OWASP_SCAN_PRO Security Audit Report"
    version: Optional[str] = "1.0"
    report_format: Optional[str] = "PDF"  # "PDF", "HTML", "JSON", "ALL"
    owasp_categories: Optional[List[str]] = Field(default_factory=list, description="Filter vulnerabilities by OWASP Top 10 categories (e.g., ['A01', 'A03'])")

class ReportResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    scan_job_id: uuid.UUID
    title: Optional[str] = None
    version: str = "1.0"
    report_format: str = "PDF"
    owasp_category: Optional[str] = None
    file_hash: str
    pdf_path: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    html_content: Optional[str] = None
    json_content: Optional[str] = None

class ReportHashResponse(BaseModel):
    report_id: uuid.UUID
    file_hash: str
    algorithm: str = "SHA-256"
    verified: bool = True
    created_at: datetime

class ReportCommentCreate(BaseModel):
    content: str

class ReportCommentResponse(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    author_id: uuid.UUID
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
