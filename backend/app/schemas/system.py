from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class HealthProbeResponse(BaseModel):
    status: str = Field("ok", description="Status string: healthy / degraded / down")
    probe: str = Field(..., description="Type of probe: liveness / readiness")
    timestamp: str
    checks: Dict[str, Any] = Field(default_factory=dict)

class DetailedHealthResponse(BaseModel):
    status: str = Field("healthy", description="Overall system health")
    uptime_seconds: float
    environment: str
    database: Dict[str, Any]
    cache: Dict[str, Any]
    scanner_workers: Dict[str, Any]
    system_resources: Dict[str, Any]
    timestamp: str

class SystemResourceUsage(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    uptime_seconds: float
    active_db_connections: int

class WorkerStatusInfo(BaseModel):
    worker_id: str
    tool_name: str  # zap, nmap, nikto
    status: str  # IDLE, RUNNING, RESTARTING, COMPLETED
    container_id: str
    current_target: Optional[str] = None
    cpu_percent: float
    memory_used_mb: float
    uptime_seconds: float

class SystemSecurityOverview(BaseModel):
    failed_logins_24h: int
    active_sessions_count: int
    rbac_violations_24h: int
    rate_limit_blocks_24h: int
    last_security_audit_at: str

class ErrorLogItem(BaseModel):
    id: str
    timestamp: str
    level: str  # ERROR, CRITICAL, WARNING
    path: str
    method: str
    status_code: int
    message: str
    exception_type: Optional[str] = None
    tenant_id: Optional[str] = None
    user_id: Optional[str] = None

class BackupInfo(BaseModel):
    id: str
    filename: str
    backup_type: str  # DATABASE, REPORTS, FULL
    size_mb: float
    sha256_hash: str
    status: str  # COMPLETED, VERIFIED, IN_PROGRESS
    created_at: str

class BackupCreateRequest(BaseModel):
    backup_type: str = Field("FULL", description="DATABASE, REPORTS, FULL")
    description: Optional[str] = None

class BackupRestoreResponse(BaseModel):
    backup_id: str
    status: str
    verification_passed: bool
    sha256_hash: str
    details: str
    restored_at: str
