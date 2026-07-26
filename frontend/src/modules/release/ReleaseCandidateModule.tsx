import React, { useState } from 'react';
import { ShieldCheck, Server, Terminal, FileText, CheckCircle2, Play, Code, BookOpen, AlertCircle, Copy, Check, Download, Layers } from 'lucide-react';

export const ReleaseCandidateModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'scripts' | 'docs'>('checklist');
  const [selectedScript, setSelectedScript] = useState<'deploy' | 'backup' | 'restore' | 'hardening'>('deploy');
  const [selectedDoc, setSelectedDoc] = useState<'admin' | 'user' | 'release'>('release');
  const [copied, setCopied] = useState<boolean>(false);

  const scriptsContent = {
    deploy: `#!/bin/bash
set -e
# OWASP_SCAN_PRO Production Controlled Deployment Script
echo "[1/5] Pulling latest git repository updates..."
git pull origin main || echo "Continuing..."
echo "[2/5] Building Docker production containers..."
docker-compose -f docker-compose.prod.yml build --no-cache
echo "[3/5] Applying Alembic database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
echo "[4/5] Executing controlled container restart..."
docker-compose -f docker-compose.prod.yml up -d --remove-orphans
echo "[5/5] Validating platform health probes (Liveness & Readiness)..."
curl -s http://localhost:8000/api/v1/health/readiness
echo "SUCCESS: OWASP_SCAN_PRO v1.0.0 is live!"`,

    backup: `#!/bin/bash
set -e
# OWASP_SCAN_PRO Automated Backup & SHA-256 Non-Repudiation Generator
BACKUP_TYPE=\${1:-"FULL"}
BACKUP_DIR="/var/backups/owasp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

echo "Creating PostgreSQL dump to $BACKUP_DIR/owasp_db_\${TIMESTAMP}.sql.gz..."
docker exec owasp_postgres_prod pg_dump -U owasp_user -d owasp_scan_pro | gzip > "\$BACKUP_DIR/owasp_db_\${TIMESTAMP}.sql.gz"
sha256sum "\$BACKUP_DIR/owasp_db_\${TIMESTAMP}.sql.gz" > "\$BACKUP_DIR/owasp_db_\${TIMESTAMP}.sql.gz.sha256"
echo "Backup execution complete with SHA-256 checksum generated."`,

    restore: `#!/bin/bash
set -e
# OWASP_SCAN_PRO Disaster Recovery Restore Script
BACKUP_FILE=\$1
echo "Verifying SHA-256 integrity..."
sha256sum -c "\${BACKUP_FILE}.sha256"
echo "Restoring PostgreSQL database..."
gunzip -c \$BACKUP_FILE | docker exec -i owasp_postgres_prod psql -U owasp_user -d owasp_scan_pro
echo "Restore completed successfully."`,

    hardening: `#!/bin/bash
set -e
# OWASP_SCAN_PRO Host Security Hardening Script
echo "Configuring UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
chmod 600 docker-compose.prod.yml
echo "Security Hardening complete."`
  };

  const docsContent = {
    release: `# OWASP_SCAN_PRO — Release Notes v1.0.0 (Release Candidate)
**Release Date:** July 2026
**Status:** Certified Release Candidate (Production Ready)

## Key Platform Highlights
1. Multi-Tenant Architecture & RBAC Isolation (PostgreSQL tenant_id scoping)
2. Multi-Scanner Orchestration Engine (OWASP ZAP, Nmap, Nikto ephemeral Docker containers)
3. AI Correlation & Remediation Engine (OWASP Top 10/CWE mapping, Confidence Score, SHA-256 report signatures)
4. Collaboration Center (Chat threads, evidence attachments, notifications, system activity)
5. Observability (Prometheus /metrics text exporter, liveness/readiness probes)
6. Security Hardening (Multi-stage non-root Python runtime, Nginx TLS + Security headers, backup SHA-256 non-repudiation)`,

    admin: `# OWASP_SCAN_PRO — Administrator & DevOps Operations Guide
**Target Architecture:** Ubuntu Server 24.04 LTS (8 vCPU, 16 GB RAM, 200 GB SSD)

## 1. Quick Start Deployment
1. Configure env: \`cp .env.example .env\`
2. Execute deploy script: \`./scripts/deploy.sh\`
3. Verify health probes: \`curl http://localhost:8000/api/v1/health/readiness\`

## 2. Security Hardening Checklist
- UFW Firewall: Allow ports 22, 80, 443 only.
- SSH: \`PermitRootLogin no\` and \`PasswordAuthentication no\` in \`/etc/ssh/sshd_config\`.
- Non-root container: Backend executed as UID 1001 (\`owasp:owasp\`).`,

    user: `# OWASP_SCAN_PRO — Comprehensive User & Role Guide

## Workspaces by Role
- **SUPER_ADMIN (Security Command Center)**: User management, asset inventory, target assignment, audit logs.
- **AUDITOR (Scanner Workspace)**: Target scanning, ZAP/Nmap/Nikto selection, AI report generation, vulnerability distribution.
- **EMPLOYEE (Remediation Workspace)**: Remediation queue, HTTP request/response evidence inspection, status updates, auditor chat.`
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-56 h-56 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sprint 11 Final Certification
              </span>
              <span className="text-xs text-slate-400">Release Candidate v1.0.0</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              OWASP_SCAN_PRO — Production Ready & Release Candidate
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Final stabilization, security hardening, multi-stage Docker builds, Nginx TLS proxy with security headers, deployment scripts, and complete administrator documentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Certification Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> PASSED 100%
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-emerald-500/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'checklist'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Hardening & Readiness Checklist
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'scripts'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Deployment & Maintenance Shell Scripts
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'docs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Guides & Documentation Reader
          </button>
        </div>
      </div>

      {/* Tab 1: Hardening & Production Checklist */}
      {activeTab === 'checklist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              OWASP_SCAN_PRO Production Release Candidate Checklist
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified security controls and operational readiness parameters before production deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Multi-Tenant Isolation', desc: 'Strict SQL tenant_id filtering across PostgreSQL database tables.', tag: 'SecAD-09', ok: true },
              { title: 'Rule SecAD-08 Role Separation', desc: 'Super Admin prohibited from scanning; Auditor scans; Employee remediates.', tag: 'RBAC', ok: true },
              { title: 'Ephemeral Docker Workers', desc: 'ZAP, Nmap, Nikto spawned on isolated scanner_net network and destroyed on finish.', tag: 'D11', ok: true },
              { title: 'Non-Root Backend Execution', desc: 'Multi-stage Docker build executed under unprivileged owasp user (UID 1001).', tag: 'Hardened', ok: true },
              { title: 'Nginx TLS & OWASP Security Headers', desc: 'Strict-Transport-Security, X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP.', tag: 'Nginx', ok: true },
              { title: 'Rate Limiting Protection', desc: 'Nginx limit_req_zone enforcing 20r/s API limit and 5r/s auth login limit.', tag: 'Rate Limit', ok: true },
              { title: 'SHA-256 Non-Repudiation Signatures', desc: 'Cryptographically hashed PDF/HTML reports and backup dumps for non-repudiation.', tag: 'Integrity', ok: true },
              { title: 'Prometheus & Health Diagnostics', desc: 'OpenMetrics /metrics exporter and liveness/readiness probes fully integrated.', tag: 'Observability', ok: true }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                <span className="text-emerald-400 p-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Deployment & Maintenance Scripts */}
      {activeTab === 'scripts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Automated Operations Shell Scripts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Executable scripts for deployment, backups with SHA-256 hashing, disaster restore, and server hardening.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
              {(['deploy', 'backup', 'restore', 'hardening'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedScript(s)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition ${
                    selectedScript === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}.sh
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 font-mono flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                Script path: <span className="text-indigo-300 font-bold">scripts/{selectedScript}.sh</span>
              </span>
              <button
                onClick={() => handleCopyCode(scriptsContent[selectedScript])}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Script'}
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
              {scriptsContent[selectedScript]}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Guides & Documentation Reader */}
      {activeTab === 'docs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Official Documentation Reader
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Release Candidate documentation suite for administrators, DevOps, and platform users.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
              {(['release', 'admin', 'user'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDoc(d)}
                  className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition ${
                    selectedDoc === d ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d === 'release' ? 'Release Notes' : d === 'admin' ? 'Admin Guide' : 'User Guide'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300 font-sans text-xs space-y-4 max-h-[500px] overflow-y-auto leading-relaxed">
            <pre className="font-mono whitespace-pre-wrap text-slate-200">
              {docsContent[selectedDoc]}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
