from typing import List, Dict, Any
from app.scanner.adapters.base_adapter import ToolExecutionResult

class ResultCollector:
    """
    Collects raw execution outputs and findings directly from ToolAdapters without altering them.
    """

    def collect(self, results: List[ToolExecutionResult]) -> List[Dict[str, Any]]:
        collected = []
        for res in results:
            for raw_f in res.raw_findings:
                collected.append({
                    "tool_name": res.tool_name,
                    "return_code": res.return_code,
                    "status": res.status,
                    "finding_data": raw_f
                })
        return collected
