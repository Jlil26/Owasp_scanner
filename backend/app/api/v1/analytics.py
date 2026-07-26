import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.analytics import (
    SecurityScoreResponse,
    OwaspBreakdownResponse,
    AnalyticsTrendsResponse,
    ScannerStatsResponse,
    RealtimeFeedResponse
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Statistics"])

@router.get(
    "/security-score",
    response_model=ApiResponse[SecurityScoreResponse],
    summary="Get calculated security score & grade"
)
def get_security_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    data = service.calculate_security_score(company_id=current_user.company_id)
    return ApiResponse(
        success=True,
        message="Global security score calculated successfully.",
        data=data
    )

@router.get(
    "/owasp-breakdown",
    response_model=ApiResponse[OwaspBreakdownResponse],
    summary="Get OWASP Top 10 category distribution"
)
def get_owasp_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    data = service.get_owasp_breakdown(company_id=current_user.company_id)
    return ApiResponse(
        success=True,
        message="OWASP category distribution retrieved successfully.",
        data=data
    )

@router.get(
    "/trends",
    response_model=ApiResponse[AnalyticsTrendsResponse],
    summary="Get scan & vulnerability activity trends over time"
)
def get_trends(
    days: int = Query(14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    data = service.get_trends(company_id=current_user.company_id, days=days)
    return ApiResponse(
        success=True,
        message=f"Historical analytics trends for last {days} days retrieved.",
        data=data
    )

@router.get(
    "/scanner-stats",
    response_model=ApiResponse[ScannerStatsResponse],
    summary="Get performance and discovery stats per scanner tool"
)
def get_scanner_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    data = service.get_scanner_stats(company_id=current_user.company_id)
    return ApiResponse(
        success=True,
        message="Scanner engine performance stats retrieved successfully.",
        data=data
    )

@router.get(
    "/realtime-feed",
    response_model=ApiResponse[RealtimeFeedResponse],
    summary="Get real-time feed telemetry events & active counters"
)
def get_realtime_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    data = service.get_realtime_feed(company_id=current_user.company_id)
    return ApiResponse(
        success=True,
        message="Real-time telemetry event stream retrieved.",
        data=data
    )
