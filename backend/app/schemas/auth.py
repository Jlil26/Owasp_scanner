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
