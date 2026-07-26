#!/bin/bash
set -e

# OWASP_SCAN_PRO Production Controlled Deployment Script
# Release Candidate v1.0.0

echo "======================================================="
echo "   OWASP_SCAN_PRO - Production Deployment (v1.0.0)   "
echo "======================================================="

# 1. Environment Verification
if [ ! -f .env ]; then
    echo "ERROR: Production .env file not found. Copy .env.example and configure secrets."
    exit 1
fi

echo "[1/5] Pulling latest git repository updates..."
git pull origin main || echo "Local environment - continuing without git pull."

echo "[2/5] Building and updating Docker production containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "[3/5] Applying Alembic database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

echo "[4/5] Executing controlled container restart..."
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

echo "[5/5] Validating platform health probes (Liveness & Readiness)..."
SLEEP_TIME=5
echo "Waiting ${SLEEP_TIME}s for backend startup..."
sleep $SLEEP_TIME

HEALTH_STATUS=$(curl -s http://localhost:8000/api/v1/health/readiness | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if [ "$HEALTH_STATUS" = "healthy" ] || [ "$HEALTH_STATUS" = "ok" ]; then
    echo "SUCCESS: Platform readiness check PASSED. OWASP_SCAN_PRO v1.0.0 is live!"
else
    echo "WARNING: Health check returned status '${HEALTH_STATUS}'. Review logs: docker-compose logs backend"
fi

echo "======================================================="
