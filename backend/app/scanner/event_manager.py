import logging
import uuid
from typing import Dict, Any, Callable, List
from sqlalchemy.orm import Session
from app.repositories.audit_repository import AuditRepository
from app.models.enums import AuditActionStatus

logger = logging.getLogger("owasp_scan_pro.scanner.event_manager")

class EventManager:
    """
    Manages internal scan lifecycle events and publishes audit records.
    """

    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}
        self.audit_repo = AuditRepository()

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def publish(self, event_type: str, data: Dict[str, Any], db: Session = None):
        logger.info(f"[EVENT-MANAGER] {event_type} -> ScanID: {data.get('scan_job_id')} | Tool: {data.get('tool_name', 'N/A')}")
        
        # Audit log integration for key scan lifecycle actions
        if db and event_type in ["ScanStarted", "ScanCompleted", "ScanCancelled", "ScanFailed"]:
            try:
                user_id = data.get("user_id")
                company_id = data.get("company_id")
                scan_job_id = data.get("scan_job_id")
                
                action_map = {
                    "ScanStarted": "START_SCAN",
                    "ScanCompleted": "COMPLETE_SCAN",
                    "ScanCancelled": "CANCEL_SCAN",
                    "ScanFailed": "FAIL_SCAN"
                }
                
                if company_id and scan_job_id:
                    self.audit_repo.log(
                        db=db,
                        company_id=company_id,
                        action=action_map.get(event_type, event_type.upper()),
                        user_id=user_id,
                        resource_type="SCAN_JOB",
                        resource_id=str(scan_job_id),
                        status=AuditActionStatus.SUCCESS,
                        details={"event": event_type, "progress": data.get("progress")}
                    )
            except Exception as e:
                logger.error(f"[EVENT-MANAGER] Failed to record audit log: {str(e)}")

        for handler in self._handlers.get(event_type, []):
            try:
                handler(data)
            except Exception as e:
                logger.error(f"[EVENT-MANAGER] Error in event handler for {event_type}: {str(e)}")
