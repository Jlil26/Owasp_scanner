import abc
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class ToolExecutionResult:
    tool_name: str
    return_code: int
    status: str  # COMPLETED, FAILED, CANCELLED
    logs: str
    raw_output: str
    raw_findings: List[Dict[str, Any]] = field(default_factory=list)

class BaseToolAdapter(abc.ABC):
    """
    Common abstract interface contract for external security scanners (ZAP, Nmap, Nikto).
    """

    @property
    @abc.abstractmethod
    def tool_name(self) -> str:
        pass

    @abc.abstractmethod
    async def run(
        self,
        target_url: str,
        owasp_categories: Optional[List[str]] = None
    ) -> ToolExecutionResult:
        """
        Execute tool against target_url and return standardized raw results.
        """
        pass
