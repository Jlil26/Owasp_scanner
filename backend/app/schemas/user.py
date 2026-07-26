import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.enums import UserStatus

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: uuid.UUID

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[uuid.UUID] = None

class UserStatusUpdate(BaseModel):
    status: UserStatus

class ResetPasswordRequest(BaseModel):
    new_password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: UserStatus
    role_id: uuid.UUID
    role_name: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
