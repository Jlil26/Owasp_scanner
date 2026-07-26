#!/bin/bash
set -e

# OWASP_SCAN_PRO Production Automated Backup & SHA-256 Non-Repudiation Generator
# Usage: ./scripts/backup.sh [DATABASE|REPORTS|FULL]

BACKUP_TYPE=${1:-"FULL"}
BACKUP_DIR="/var/backups/owasp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "======================================================="
echo "   OWASP_SCAN_PRO - Backup Routine ($BACKUP_TYPE)   "
echo "======================================================="

# Database Backup
if [ "$BACKUP_TYPE" = "DATABASE" ] || [ "$BACKUP_TYPE" = "FULL" ]; then
    DB_FILE="${BACKUP_DIR}/owasp_db_${TIMESTAMP}.sql.gz"
    echo "Creating PostgreSQL database snapshot to $DB_FILE..."
    docker exec owasp_postgres_prod pg_dump -U owasp_user -d owasp_scan_pro | gzip > $DB_FILE
    
    # Calculate SHA-256 checksum for non-repudiation
    sha256sum $DB_FILE > "${DB_FILE}.sha256"
    echo "Database backup SHA-256: $(cat ${DB_FILE}.sha256 | awk '{print $1}')"
fi

# Reports Volume Backup
if [ "$BACKUP_TYPE" = "REPORTS" ] || [ "$BACKUP_TYPE" = "FULL" ]; then
    REP_FILE="${BACKUP_DIR}/owasp_reports_${TIMESTAMP}.tar.gz"
    echo "Creating Reports volume archive to $REP_FILE..."
    docker run --rm --volumes-from owasp_backend_prod -v $BACKUP_DIR:/backup alpine tar czf /backup/$(basename $REP_FILE) /app/storage/reports
    
    sha256sum $REP_FILE > "${REP_FILE}.sha256"
    echo "Reports archive SHA-256: $(cat ${REP_FILE}.sha256 | awk '{print $1}')"
fi

# Retention Cleanup (sliding 30-day window)
echo "Cleaning up backup snapshots older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup execution complete."
echo "======================================================="
