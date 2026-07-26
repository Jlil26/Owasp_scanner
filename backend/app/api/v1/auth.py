from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    LogoutRequest,
    LoginResponseData,
    RefreshTokenResponseData,
    UserMeResponseData
)
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/login",
    response_model=StandardResponse[LoginResponseData],
    summary="Authenticate user and issue JWT tokens",
    status_code=status.HTTP_200_OK
)
def login(
    request: Request,
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    auth_service = AuthService(db)
    result = auth_service.login(
        email=credentials.email,
        password=credentials.password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return StandardResponse(
        success=True,
        message="Authentication successful",
        data=result
    )

@router.post(
    "/refresh",
    response_model=StandardResponse[RefreshTokenResponseData],
    summary="Renew access token using a valid refresh token",
    status_code=status.HTTP_200_OK
)
def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    auth_service = AuthService(db)
    result = auth_service.refresh_access_token(
        refresh_token_str=body.refresh_token,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return StandardResponse(
        success=True,
        message="Token refreshed successfully",
        data=result
    )

@router.post(
    "/logout",
    response_model=StandardResponse[dict],
    summary="Invalidate session and revoke refresh tokens",
    status_code=status.HTTP_200_OK
)
def logout(
    request: Request,
    body: LogoutRequest = LogoutRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    auth_service = AuthService(db)
    auth_service.logout(
        current_user_id=current_user.id,
        company_id=current_user.company_id,
        refresh_token_str=body.refresh_token,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return StandardResponse(
        success=True,
        message="Logged out successfully",
        data={}
    )

@router.get(
    "/me",
    response_model=StandardResponse[UserMeResponseData],
    summary="Retrieve authenticated user profile and permissions",
    status_code=status.HTTP_200_OK
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    result = auth_service.get_me(user_id=current_user.id)

    return StandardResponse(
        success=True,
        message="User profile retrieved successfully",
        data=result
    )
