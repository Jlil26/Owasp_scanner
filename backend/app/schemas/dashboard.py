import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class SeverityDistribution(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0

class StatusDistribution(BaseModel):
    new: int = 0
    assigned: int = 0
    in_progress: int = 0
    resolved: int = 0
    verified: int = 0
    closed: int = 0
    reopened: int = 0

class AdminDashboardResponse(BaseModel):
    total_tenants: int = 1
    total_users: int = 0
    total_scans: int = 0
    total_vulnerabilities: int = 0
    active_remediations: int = 0
    overdue_slas: int = 0
    remediation_rate: float = 0.0
    security_score: int = 100
    security_grade: str = "A"
    severity_distribution: SeverityDistribution
    status_distribution: StatusDistribution

class AuditorDashboardResponse(BaseModel):
    assigned_targets: int = 0
    total_scans_executed: int = 0
    vulnerabilities_discovered: int = 0
    pending_verifications: int = 0
    security_score: int = 100
    severity_distribution: SeverityDistribution

class EmployeeDashboardResponse(BaseModel):
    assigned_vulnerabilities: int = 0
    in_progress_count: int = 0
    resolved_count: int = 0
    overdue_count: int = 0
    security_score: int = 100
    severity_distribution: SeverityDistribution
