from pydantic import BaseModel, Field
from typing import Dict, Any

class HealthResponse(BaseModel):
    status: str = Field("ok", description="Application status")
    service: str = Field("OWASP_SCAN_PRO Backend", description="Service name")
    version: str = Field("0.1.0", description="Application version")
    environment: str = Field("development", description="Current environment")
    details: Dict[str, Any] = Field(default_factory=dict, description="Component status details")
