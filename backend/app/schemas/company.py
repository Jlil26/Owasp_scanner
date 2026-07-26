import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.enums import CompanyStatus

class CompanyCreate(BaseModel):
    name: str
    legal_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    country: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    status: Optional[CompanyStatus] = None

class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    legal_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    country: Optional[str] = None
    status: CompanyStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
