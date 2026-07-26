# OWASP_SCAN_PRO — Administrator & DevOps Operations Guide
**Version:** 1.0.0 Release Candidate  
**Target Architecture:** Ubuntu Server 24.04 LTS (8 vCPU, 16 GB RAM, 200 GB SSD)

---

## 1. Production Architecture Overview

OWASP_SCAN_PRO is deployed as a modular containerized architecture managed by Docker Compose:
- **Nginx Reverse Proxy**: Terminates TLS/SSL (443), enforces HSTS, CSP, rate limiting (`limit_req_zone`), and routes traffic.
- **FastAPI Backend (`owasp_backend_prod`)**: Hardened Python 3.13 image running as non-root user `owasp:owasp` (UID 1001).
- **React Frontend (`owasp_frontend_prod`)**: Built SPA served via Nginx with caching.
- **PostgreSQL Database (`owasp_postgres_prod`)**: Multi-tenant relational storage isolated by `tenant_id`.
- **Redis Cache & Job Queue (`owasp_redis_prod`)**: Asynchronous scan orchestration and response caching.
- **Ephemeral Docker Scan Workers**: OWASP ZAP, Nmap, Nikto containers spawned dynamically per scan campaign on `scanner_net`.

---

## 2. Environment Setup & Configuration

Copy `.env.example` to `.env` on the host:
```bash
cp .env.example .env
```

### Essential Production Variables:
| Variable | Description | Example / Required |
|----------|-------------|--------------------|
| `ENVIRONMENT` | Environment type | `production` |
| `POSTGRES_PASSWORD` | PostgreSQL database user password | Strong random string (min 20 chars) |
| `JWT_SECRET` | Secret key for JWT signing | 64-character hex string |
| `REDIS_PASSWORD` | Password for Redis access | Strong random string |
| `OPENAI_API_KEY` | Key for AI Correlation & Recommendation Engine | `sk-proj-...` |

---

## 3. Server Security Hardening Procedure

Run the security hardening script:
```bash
chmod +x scripts/security_hardening.sh
./scripts/security_hardening.sh
```

### Key Hardening Checks:
1. **Firewall (UFW)**: Permit incoming traffic ONLY on ports `22` (SSH), `80` (HTTP redirect), and `443` (HTTPS).
2. **SSH Hardening**: In `/etc/ssh/sshd_config`, ensure:
   ```ini
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```
3. **Non-Root Execution**: Backend container runs strictly as non-root user (`USER owasp`).

---

## 4. Deployment & Controlled Rollout

To execute a zero-downtime controlled deployment with database migrations and health check verification:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Manual Step-by-Step Equivalent:
```bash
# 1. Build images
docker-compose -f docker-compose.prod.yml build

# 2. Run Alembic database migrations
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# 3. Launch services
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify health probes
curl -s http://localhost:8000/api/v1/health/readiness
```

---

## 5. Automated Backups & Disaster Recovery

### Creating a Backup:
```bash
# Full backup (Database + Reports volume)
./scripts/backup.sh FULL

# Database snapshot only
./scripts/backup.sh DATABASE
```

Backups are saved to `/var/backups/owasp/` along with a `.sha256` checksum file guaranteeing non-repudiation.

### Restoring from a Backup:
```bash
./scripts/restore.sh /var/backups/owasp/owasp_db_20260725_020000.sql.gz
```
*Note: The script automatically verifies the cryptographic SHA-256 hash before executing the restoration.*

---

## 6. Prometheus Monitoring & Log Inspection

- **Prometheus Metrics Scrape Route**: `GET /api/v1/metrics`
- **Application Error Feed**: `GET /api/v1/system/errors`
- **Container Log Inspection**:
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend
  ```
