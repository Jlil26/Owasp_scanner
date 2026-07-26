# OWASP_SCAN_PRO - Continuous Web Vulnerability Management Platform

> **Sprint -1 : Bootstrap du projet**  
> Technical Foundation & Infrastructure Initialized.

---

## 🚀 Quick Start

To start all services (Backend FastAPI, Frontend React, PostgreSQL, Redis, Nginx Reverse Proxy) using Docker Compose:

```bash
docker compose up --build
```

---

## 🌐 Accessing Services

Once started, the services are available at:

- **Reverse Proxy / Unified Application**: [http://localhost](http://localhost)
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend FastAPI Service**: [http://localhost:8000](http://localhost:8000)
- **FastAPI OpenAPI Documentation**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Health Check Route**: [http://localhost:8000/health](http://localhost:8000/health) or [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 🛠️ Stack & Architecture Overview

### Backend (`backend/`)
- **Framework**: FastAPI (Python 3.11+)
- **Package & Dependency Manager**: `uv` / `pyproject.toml` / `requirements.txt`
- **Code Quality**: Ruff (`ruff.toml`), Pre-commit (`.pre-commit-config.yaml`)
- **Testing**: pytest (`pytest.ini`)
- **Database Migrations**: Alembic (`alembic/`)
- **Architecture**: Modular layered structure (`app/api`, `app/core`, `app/models`, `app/schemas`, `app/services`, `app/repositories`, `app/scanner`, `app/ai`, `app/auth`, etc.)

### Frontend (`frontend/`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Linting & Formatting**: ESLint (`.eslintrc.cjs`) & Prettier (`.prettierrc`)
- **Architecture**: Modular domain structure (`src/app`, `src/layouts`, `src/pages`, `src/modules`, `src/components`, `src/hooks`, `src/services`, `src/store`, `src/routes`, `src/assets`, `src/styles`, `src/types`, `src/utils`)

### Infrastructure (`docker/`, `infrastructure/`, `docker-compose.yml`)
- **Services**: `backend`, `frontend`, `postgres`, `redis`, `nginx`
- **Reverse Proxy**: Nginx routes `/api/` to `backend:8000` and `/` to `frontend:3000`

---

## 🧪 Running Tests & Linting

### Backend
```bash
cd backend
pytest
ruff check .
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

---

## 📋 Sprint Validation Criteria
- [x] FastAPI backend initializes and boots up.
- [x] `/health` route responds with JSON status.
- [x] React + TypeScript + Vite frontend initializes with Tailwind CSS.
- [x] "OWASP_SCAN_PRO - Development Environment Ready" welcome screen displayed.
- [x] Docker Compose configured for backend, frontend, postgres, redis, and nginx.
- [x] Repository tree strictly respects system architecture specification.
