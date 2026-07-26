# OWASP_SCAN_PRO — Comprehensive User & Role Guide
**Version:** 1.0.0 Release Candidate

OWASP_SCAN_PRO features three distinct workspaces tailored to the specific responsibilities of each platform role.

---

## 1. Role: Super Administrator (`SUPER_ADMIN`)
**Workspace:** Security Command Center

The Super Administrator oversees platform governance and company administration.  
*Note: In accordance with Security Rule SecAD-08, Super Admins never launch scans directly.*

### Key Responsibilities:
1. **Organization & Company Management**: Configure company details, legal name, contact information, and domain scoping.
2. **User & Role Administration**:
   - Create accounts for Auditeurs and Employés (`POST /api/v1/users`).
   - Suspend or reactivate user accounts (`PATCH /api/v1/users/{id}/status`).
   - Reset user passwords safely (`POST /api/v1/users/{id}/reset-password`).
3. **Asset Inventory Management**: Declare Web Sites, REST APIs, and Web Applications owned by the organization.
4. **Auditor Target Scoping**: Assign declared assets to specific Auditeurs.
5. **Immutable Audit Logs**: Consult non-repudiable audit logs (`GET /api/v1/audit/logs`) tracking every platform action.

---

## 2. Role: Auditor (`AUDITOR`)
**Workspace:** Scanner Workspace

The Auditor is the sole role authorized to launch, monitor, and configure vulnerability scanning campaigns.

### Workflow:
1. **Selecting Target**: Choose from assigned targets (`GET /api/v1/targets`).
2. **Scanner Selection**: Choose from integrated engines:
   - **OWASP ZAP**: Active DAST scanning for web vulnerabilities (SQLi, XSS, CSRF).
   - **Nmap**: Port scanning, service detection, and OS fingerprinting.
   - **Nikto**: Web server misconfiguration and outdated component scanning.
3. **OWASP Categories**: Select relevant OWASP Top 10 categories (A01 through A10).
4. **Execution & Real-Time Tracking**: Launch the scan job (`POST /api/v1/scans`) and monitor real-time worker progress.
5. **AI Analysis & Reporting**: Review AI deduplicated results and download cryptographically signed SHA-256 PDF/HTML reports.
6. **Vulnerability Assignment**: Distribute validated vulnerabilities to designated Employés for remediation.

---

## 3. Role: Employee (`EMPLOYEE`)
**Workspace:** Remediation Workspace

The Employee focuses exclusively on addressing assigned security vulnerabilities.

### Workflow:
1. **Remediation Queue**: Review assigned vulnerabilities (`GET /api/v1/vulnerabilities?assigned_to_me=true`).
2. **Evidence & Recommendations**: Inspect HTTP request/response evidence, CVSS scores, CWE references, and AI remediation guidance.
3. **Status Updates**: Update ticket state (`New` -> `In Progress` -> `Resolved`).
4. **Collaboration & Discussion**: Chat directly with the Auditor on specific vulnerability threads (`POST /api/v1/vulnerabilities/{id}/comment`).
5. **Verification**: Request re-verification upon next scan run.
