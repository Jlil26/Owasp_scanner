from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.health import HealthResponse
from app.schemas.system import HealthProbeResponse, DetailedHealthResponse
from app.services.system_service import SystemService
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """
    Standard health check endpoint.
    """
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        details={
            "database": "configured",
            "cache": "configured",
            "scanner_engine": "ready",
            "ai_engine": "ready"
        }
    )

@router.get("/health/liveness", response_model=HealthProbeResponse, tags=["Health"])
def liveness_probe():
    """
    Liveness probe for container orchestrators (e.g. Docker, Kubernetes).
    """
    return SystemService.get_liveness_status()

@router.get("/health/readiness", response_model=HealthProbeResponse, tags=["Health"])
def readiness_probe(db: Session = Depends(get_db)):
    """
    Readiness probe verifying DB connections, cache, and worker engine.
    """
    return SystemService.get_readiness_status(db)

@router.get("/health/detailed", response_model=DetailedHealthResponse, tags=["Health"])
def detailed_health(db: Session = Depends(get_db)):
    """
    Detailed system diagnostics including component statuses and uptime.
    """
    return SystemService.get_detailed_health(db)
