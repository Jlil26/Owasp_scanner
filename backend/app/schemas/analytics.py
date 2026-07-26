import uuid
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class SecurityScoreResponse(BaseModel):
    score: int = Field(..., description="Overall security score between 0 and 100")
    grade: str = Field(..., description="A, B, C, D, or F risk grade")
    trend_delta: float = Field(..., description="Percentage point change compared to previous period")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    penalty_breakdown: Dict[str, int] = Field(default_factory=dict)
    historical_scores: List[Dict[str, Any]] = Field(default_factory=list)

class OwaspCategoryCount(BaseModel):
    code: str
    name: str
    count: int
    percentage: float
    critical_count: int = 0

class OwaspBreakdownResponse(BaseModel):
    total_findings: int
    categories: List[OwaspCategoryCount]

class TrendDataPoint(BaseModel):
    date: str
    scans_count: int
    discovered: int
    resolved: int

class AnalyticsTrendsResponse(BaseModel):
    period: str
    trend: List[TrendDataPoint]

class ScannerToolStats(BaseModel):
    tool_name: str
    total_runs: int
    findings_count: int
    avg_duration_seconds: float
    success_rate: float

class ScannerStatsResponse(BaseModel):
    tools: List[ScannerToolStats]

class RealtimeEvent(BaseModel):
    id: str
    timestamp: str
    event_type: str
    severity: Optional[str] = None
    title: str
    description: str

class RealtimeFeedResponse(BaseModel):
    active_scans_count: int
    open_critical_count: int
    pending_verifications_count: int
    events: List[RealtimeEvent]
