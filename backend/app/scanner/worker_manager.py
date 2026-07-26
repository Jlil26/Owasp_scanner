import asyncio
import logging
import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.scanner.adapters.base_adapter import BaseToolAdapter, ToolExecutionResult
from app.scanner.adapters.zap_adapter import ZAPAdapter
from app.scanner.adapters.nmap_adapter import NmapAdapter
from app.scanner.adapters.nikto_adapter import NiktoAdapter
from app.models.enums import ToolExecutionStatus

logger = logging.getLogger("owasp_scan_pro.scanner.worker_manager")

class WorkerManager:
    """
    Spawns ephemeral tool workers (ZAP, Nmap, Nikto) in parallel and manages execution lifecycle.
    """

    def __init__(self):
        self.adapters: Dict[str, BaseToolAdapter] = {
            "zap": ZAPAdapter(),
            "nmap": NmapAdapter(),
            "nikto": NiktoAdapter()
        }

    async def execute_worker(
        self,
        tool_name: str,
        target_url: str,
        owasp_categories: Optional[List[str]] = None
    ) -> ToolExecutionResult:
        clean_name = tool_name.strip().lower()
        adapter = self.adapters.get(clean_name)
        if not adapter:
            logger.error(f"[WORKER-MANAGER] Unsupported tool: {tool_name}")
            return ToolExecutionResult(
                tool_name=tool_name,
                return_code=1,
                status="FAILED",
                logs=f"Unsupported scanner tool: {tool_name}",
                raw_output="",
                raw_findings=[]
            )

        logger.info(f"[WORKER-MANAGER] Spawning worker for {clean_name} targeting {target_url}")
        try:
            result = await adapter.run(target_url=target_url, owasp_categories=owasp_categories)
            return result
        except Exception as e:
            logger.exception(f"[WORKER-MANAGER] Exception during {clean_name} execution: {str(e)}")
            return ToolExecutionResult(
                tool_name=tool_name,
                return_code=1,
                status="FAILED",
                logs=f"Worker failure: {str(e)}",
                raw_output="",
                raw_findings=[]
            )
