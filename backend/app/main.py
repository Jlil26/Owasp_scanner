import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.companies import router as companies_router
from app.api.v1.users import router as users_router
from app.api.v1.roles import router as roles_router
from app.api.v1.assets import router as assets_router
from app.api.v1.targets import router as targets_router
from app.api.v1.audit import router as audit_router
from app.api.v1.scans import router as scans_router
from app.api.v1.findings import router as findings_router
from app.api.v1.reports import router as reports_router
from app.api.v1.vulnerabilities import router as vulnerabilities_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.dashboards import router as dashboards_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.messaging import router as messaging_router
from app.api.v1.attachments import router as attachments_router
from app.api.v1.activity import router as activity_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.system import router as system_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("owasp_scan_pro")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="OWASP_SCAN_PRO - Cybersecurity Vulnerability Management Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-MS"] = str(process_time)
    logger.info(
        f"request_id={request_id} method={request.method} path={request.url.path} "
        f"status_code={response.status_code} process_time_ms={process_time}ms"
    )
    return response

# Root level health & metrics endpoint
@app.get("/health", tags=["Health"])
def root_health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# API v1 Router
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(companies_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(roles_router, prefix=settings.API_V1_STR)
app.include_router(assets_router, prefix=settings.API_V1_STR)
app.include_router(targets_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(scans_router, prefix=settings.API_V1_STR)
app.include_router(findings_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(vulnerabilities_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(dashboards_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(messaging_router, prefix=settings.API_V1_STR)
app.include_router(attachments_router, prefix=settings.API_V1_STR)
app.include_router(activity_router, prefix=settings.API_V1_STR)
app.include_router(metrics_router, prefix=settings.API_V1_STR)
app.include_router(system_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting OWASP_SCAN_PRO Backend Bootstrap Service")
    try:
        from app.core.database import Base, engine
        import app.models  # noqa
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully")
    except Exception as e:
        logger.warning(f"Database auto-initialization check skipped/deferred: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Stopping OWASP_SCAN_PRO Backend Bootstrap Service")
