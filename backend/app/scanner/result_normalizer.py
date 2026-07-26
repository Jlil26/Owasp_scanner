import uuid
from typing import List, Dict, Any
from app.models.finding import Finding

class ResultNormalizer:
    """
    Normalizes heterogeneous raw tool findings into standardized Finding data dictionary format.
    """

    def normalize_finding(
        self,
        scan_job_id: uuid.UUID,
        tool_execution_id: uuid.UUID,
        tool_name: str,
        raw_finding: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "id": uuid.uuid4(),
            "scan_job_id": scan_job_id,
            "tool_execution_id": tool_execution_id,
            "scanner_name": tool_name.upper(),
            "title": raw_finding.get("title", f"Vulnerability detected by {tool_name}"),
            "severity": raw_finding.get("severity", "Medium"),
            "description": raw_finding.get("description", ""),
            "http_request": raw_finding.get("http_request"),
            "http_response": raw_finding.get("http_response"),
            "evidence_notes": raw_finding.get("evidence_notes"),
            "raw_data": raw_finding.get("raw_data", {})
        }
