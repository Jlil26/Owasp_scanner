#!/bin/bash
set -e

# OWASP_SCAN_PRO Disaster Recovery Backup Restore Script
# Usage: ./scripts/restore.sh <backup_file_path>

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./scripts/restore.sh <path_to_backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file $BACKUP_FILE does not exist."
    exit 1
fi

SHA256_FILE="${BACKUP_FILE}.sha256"

echo "======================================================="
echo "   OWASP_SCAN_PRO - Disaster Recovery Restore          "
echo "======================================================="

# 1. SHA-256 Non-Repudiation Check
if [ -f "$SHA256_FILE" ]; then
    echo "[1/3] Verifying cryptographic SHA-256 integrity..."
    sha256sum -c $SHA256_FILE || {
        echo "CRITICAL ERROR: Cryptographic SHA-256 verification FAILED! Backup file has been tampered with or corrupted."
        exit 1
    }
    echo "SHA-256 checksum verified OK."
else
    echo "[WARNING] No .sha256 hash file found. Proceeding with caution."
fi

# 2. Database Restore
echo "[2/3] Restoring PostgreSQL database from gzip archive..."
gunzip -c $BACKUP_FILE | docker exec -i owasp_postgres_prod psql -U owasp_user -d owasp_scan_pro

# 3. Post-Restore Health Probe
echo "[3/3] Validating platform health post-restore..."
curl -s http://localhost:8000/api/v1/health/readiness

echo "Restore completed successfully."
echo "======================================================="
