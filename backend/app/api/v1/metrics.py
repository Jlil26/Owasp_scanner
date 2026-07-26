from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.system_service import SystemService

router = APIRouter()

@router.get("/metrics", tags=["Metrics"])
def get_prometheus_metrics(db: Session = Depends(get_db)):
    """
    Exposes system metrics in standard Prometheus text format for scraping.
    """
    metrics_data = SystemService.generate_prometheus_metrics(db)
    return Response(content=metrics_data, media_type="text/plain; version=0.0.4; charset=utf-8")
