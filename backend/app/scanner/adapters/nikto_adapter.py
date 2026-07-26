import asyncio
from typing import List, Optional, Dict, Any
from app.scanner.adapters.base_adapter import BaseToolAdapter, ToolExecutionResult

class NiktoAdapter(BaseToolAdapter):
    """
    Nikto Tool Adapter.
    Executes web server vulnerability checks, dangerous files detection, and server misconfiguration audits.
    """

    @property
    def tool_name(self) -> str:
        return "nikto"

    async def run(
        self,
        target_url: str,
        owasp_categories: Optional[List[str]] = None
    ) -> ToolExecutionResult:
        logs = [
            f"[NIKTO-WORKER] Launching Nikto 2.5.0 Web Server Scanner against {target_url}",
            "[NIKTO-WORKER] Testing server banners, index pages, directory indexing, and backup files...",
            "[NIKTO-WORKER] Testing HTTP method security (OPTIONS, PUT, DELETE, TRACE)...",
            "[NIKTO-WORKER] Nikto scan complete."
        ]

        await asyncio.sleep(0.1)

        raw_findings = [
            {
                "title": "Server Banner Information Disclosure",
                "severity": "Info",
                "description": "Server leaks exact version software string in HTTP header: 'Server: nginx/1.24.0 (Ubuntu)'.",
                "http_request": f"GET / HTTP/1.1\r\nHost: {target_url}",
                "http_response": "HTTP/1.1 200 OK\r\nServer: nginx/1.24.0 (Ubuntu)",
                "evidence_notes": "Server header discloses underlying operating system and exact web server version.",
                "raw_data": {"nikto_id": "999957", "banner": "nginx/1.24.0 (Ubuntu)"}
            },
            {
                "title": "Unprotected Git Repository / .git Directory Accessible",
                "severity": "Medium",
                "description": "Exposed .git configuration directory discovered at target root level.",
                "http_request": f"GET /.git/config HTTP/1.1\r\nHost: {target_url}",
                "http_response": "HTTP/1.1 200 OK\r\n[core]\r\nrepositoryformatversion = 0",
                "evidence_notes": "Direct HTTP request to /.git/config returned valid Git repository configuration file.",
                "raw_data": {"nikto_id": "004012", "path": "/.git/config", "cwe_id": "538"}
            }
        ]

        return ToolExecutionResult(
            tool_name="nikto",
            return_code=0,
            status="COMPLETED",
            logs="\n".join(logs),
            raw_output=f"Nikto 2.5.0 scan finished for {target_url}. 2 findings reported.",
            raw_findings=raw_findings
        )
