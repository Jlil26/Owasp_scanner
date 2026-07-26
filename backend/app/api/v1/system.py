from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas.system import (
    SystemResourceUsage,
    WorkerStatusInfo,
    SystemSecurityOverview,
    ErrorLogItem,
    BackupInfo,
    BackupCreateRequest,
    BackupRestoreResponse
)
from app.schemas.common import StandardResponse
from app.services.system_service import SystemService
from app.models.user import User

router = APIRouter(prefix="/system", tags=["Platform System Management"])

@router.get("/status", response_model=StandardResponse[SystemResourceUsage])
def get_system_status(current_user: User = Depends(get_current_user)):
    """
    Get system CPU, RAM, Disk, DB connections, and uptime metrics.
    """
    data = SystemService.get_system_resources()
    return StandardResponse(
        success=True,
        message="System status metrics retrieved",
        data=data
    )

@router.get("/workers", response_model=StandardResponse[List[WorkerStatusInfo]])
def get_workers_status(current_user: User = Depends(get_current_user)):
    """
    Get status of ephemeral Docker scanning workers (ZAP, Nmap, Nikto).
    """
    data = SystemService.get_workers_status()
    return StandardResponse(
        success=True,
        message="Scan workers status retrieved",
        data=data
    )

@router.get("/security", response_model=StandardResponse[SystemSecurityOverview])
def get_security_overview(current_user: User = Depends(get_current_user)):
    """
    Get platform security monitoring counters (failed logins, active sessions, RBAC violations).
    """
    data = SystemService.get_security_overview()
    return StandardResponse(
        success=True,
        message="Security metrics overview retrieved",
        data=data
    )

@router.get("/errors", response_model=StandardResponse[List[ErrorLogItem]])
def get_error_logs(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent application error logs and exception tracking feed.
    """
    data = SystemService.get_error_logs(limit=limit)
    return StandardResponse(
        success=True,
        message="Error logs retrieved",
        data=data
    )

@router.get("/backups", response_model=StandardResponse[List[BackupInfo]])
def list_backups(current_user: User = Depends(get_current_user)):
    """
    List all database and report storage volume backups.
    """
    data = SystemService.get_backups()
    return StandardResponse(
        success=True,
        message="Backups list retrieved",
        data=data
    )

@router.post("/backups", response_model=StandardResponse[BackupInfo], status_code=status.HTTP_201_CREATED)
def create_backup(
    req: BackupCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Trigger manual or scheduled backup snapshot generation with SHA-256 non-repudiation hashing.
    """
    data = SystemService.create_backup(backup_type=req.backup_type, description=req.description)
    return StandardResponse(
        success=True,
        message="Backup snapshot created successfully",
        data=data
    )

@router.post("/backups/{id}/restore", response_model=StandardResponse[BackupRestoreResponse])
def restore_backup(
    id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Test and execute backup verification & database/volume restore.
    """
    data = SystemService.restore_backup(backup_id=id)
    return StandardResponse(
        success=True,
        message="Backup restore simulation executed",
        data=data
    )
