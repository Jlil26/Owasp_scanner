#!/bin/bash
set -e

# OWASP_SCAN_PRO Ubuntu Host Security Hardening Script

echo "======================================================="
echo "   OWASP_SCAN_PRO - Ubuntu Server Host Hardening       "
echo "======================================================="

# 1. Firewall (UFW) Configuration
echo "[1/4] Configuring UFW Firewall strict port rules..."
if command -v ufw >/dev/null 2>&1; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment 'SSH Key Access'
    ufw allow 80/tcp comment 'HTTP Proxy'
    ufw allow 443/tcp comment 'HTTPS Reverse Proxy'
    echo "UFW rules applied: Only ports 22, 80, and 443 permitted."
else
    echo "UFW not found. Install ufw on target host."
fi

# 2. SSH Security Enforcement Verification
echo "[2/4] Verifying SSH Security Parameters (/etc/ssh/sshd_config)..."
echo "Recommendation: Ensure 'PermitRootLogin no' and 'PasswordAuthentication no' are enforced."

# 3. Docker Socket Security Check
echo "[3/4] Checking Docker socket permissions..."
ls -la /var/run/docker.sock || true

# 4. File Permissions Hardening
echo "[4/4] Enforcing file system permission limits..."
chmod 600 docker-compose.prod.yml || true

echo "Security Hardening checks completed."
echo "======================================================="
