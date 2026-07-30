from typing import Optional, List
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserSummary(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_id: str
    company_name: Optional[str] = None
    role: str
    permissions: List[str] = []

class LoginResponseData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserSummary

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponseData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

class RegisterCompanyRequest(BaseModel):
    admin_name: str
    email: EmailStr
    password: str
    company_name: str
    phone: Optional[str] = None
    country: Optional[str] = None
    accept_terms: Optional[bool] = True

class CompanySummary(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    plan: Optional[str] = "PME_STARTER"
    created_at: Optional[str] = None

class RegisterCompanyResponseData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserSummary
    company: CompanySummary

class UserMeResponseData(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    company_id: str
    company_name: Optional[str] = None
    role: str
    permissions: List[str] = []
