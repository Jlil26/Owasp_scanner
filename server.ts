import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // FastAPI mock/proxy endpoint for AI Studio dev server environment
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'OWASP_SCAN_PRO Backend (FastAPI)',
      version: '1.0.0',
      environment: 'development',
      details: {
        database: 'configured',
        cache: 'configured',
        scanner_engine: 'ready',
        ai_engine: 'ready'
      }
    });
  });

  // --- SPRINT 13: SAAS AUTH & SME REGISTRATION ENDPOINTS ---
  const dbCompanies: any[] = [];
  const dbUsers: any[] = [];

  app.post('/api/v1/auth/register-company', (req, res) => {
    const { admin_name, email, password, company_name, phone, country } = req.body;
    
    if (!admin_name || !email || !password || !company_name) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires (Nom, Email, Mot de passe, Nom de la PME) doivent être renseignés.'
      });
    }

    const companyId = `pme-${Date.now().toString(36)}`;
    const userId = `usr-${Date.now().toString(36)}`;

    const newCompany = {
      id: companyId,
      name: company_name,
      slug: company_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      phone: phone || '',
      country: country || 'France',
      plan: 'PME_STARTER',
      created_at: new Date().toISOString()
    };

    const names = admin_name.split(' ');
    const firstName = names[0] || admin_name;
    const lastName = names.slice(1).join(' ') || 'Admin';

    const newSuperAdmin = {
      id: userId,
      company_id: companyId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: 'SUPER_ADMIN',
      is_active: true,
      created_at: new Date().toISOString()
    };

    dbCompanies.push(newCompany);
    dbUsers.push(newSuperAdmin);

    const token = `jwt-sec-token-${userId}-${Date.now()}`;

    res.status(201).json({
      success: true,
      message: 'Compte PME et Super Admin créés avec succès.',
      data: {
        access_token: token,
        token_type: 'bearer',
        company: newCompany,
        user: newSuperAdmin
      }
    });
  });

  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = dbUsers.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
      // Demo fallback for instant preview testing if db is empty
      if (email === 'admin@pme.com') {
        const demoCompany = { id: 'pme-demo', name: 'Demo Cyber PME', slug: 'demo-cyber-pme', country: 'France', plan: 'PME_STARTER', created_at: new Date().toISOString() };
        const demoUser = { id: 'usr-admin-demo', company_id: 'pme-demo', email: 'admin@pme.com', first_name: 'Super', last_name: 'Admin', role: 'SUPER_ADMIN', is_active: true, created_at: new Date().toISOString() };
        return res.json({
          success: true,
          message: 'Connexion réussie',
          data: { access_token: `jwt-demo-${Date.now()}`, token_type: 'bearer', company: demoCompany, user: demoUser }
        });
      }
      if (email === 'auditor@pme.com') {
        const demoCompany = { id: 'pme-demo', name: 'Demo Cyber PME', slug: 'demo-cyber-pme', country: 'France', plan: 'PME_STARTER', created_at: new Date().toISOString() };
        const demoUser = { id: 'usr-auditor-demo', company_id: 'pme-demo', email: 'auditor@pme.com', first_name: 'Lead', last_name: 'Auditor', role: 'AUDITOR', is_active: true, created_at: new Date().toISOString() };
        return res.json({
          success: true,
          message: 'Connexion réussie',
          data: { access_token: `jwt-demo-${Date.now()}`, token_type: 'bearer', company: demoCompany, user: demoUser }
        });
      }
      if (email === 'employee@pme.com') {
        const demoCompany = { id: 'pme-demo', name: 'Demo Cyber PME', slug: 'demo-cyber-pme', country: 'France', plan: 'PME_STARTER', created_at: new Date().toISOString() };
        const demoUser = { id: 'usr-employee-demo', company_id: 'pme-demo', email: 'employee@pme.com', first_name: 'Dev', last_name: 'Employee', role: 'EMPLOYEE', is_active: true, created_at: new Date().toISOString() };
        return res.json({
          success: true,
          message: 'Connexion réussie',
          data: { access_token: `jwt-demo-${Date.now()}`, token_type: 'bearer', company: demoCompany, user: demoUser }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides. Aucun compte associé à cet e-mail.'
      });
    }

    const company = dbCompanies.find(c => c.id === user.company_id) || { id: user.company_id, name: 'PME Enterprise' };
    const token = `jwt-token-${user.id}-${Date.now()}`;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        access_token: token,
        token_type: 'bearer',
        company,
        user
      }
    });
  });

  app.post('/api/v1/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    res.json({
      success: true,
      message: `Un e-mail de réinitialisation sécurisé a été envoyé à ${email || 'votre adresse'}.`
    });
  });

  app.post('/api/v1/auth/reset-password', (req, res) => {
    res.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });
  });

  app.get('/api/v1/users', (req, res) => {
    res.json({
      success: true,
      data: dbUsers
    });
  });

  app.post('/api/v1/users', (req, res) => {
    const { company_id, email, first_name, last_name, role } = req.body;
    const newUser = {
      id: `usr-${Date.now().toString(36)}`,
      company_id: company_id || 'pme-default',
      email,
      first_name,
      last_name,
      role: role || 'EMPLOYEE',
      is_active: true,
      created_at: new Date().toISOString()
    };
    dbUsers.push(newUser);
    res.status(201).json({
      success: true,
      message: `Utilisateur ${first_name} ${last_name} (${role}) créé.`,
      data: newUser
    });
  });

  app.get('/api/v1/health/liveness', (req, res) => {
    res.json({
      status: 'healthy',
      probe: 'liveness',
      timestamp: new Date().toISOString(),
      checks: { process_running: true, uptime_seconds: Math.round(process.uptime()) }
    });
  });

  app.get('/api/v1/health/readiness', (req, res) => {
    res.json({
      status: 'healthy',
      probe: 'readiness',
      timestamp: new Date().toISOString(),
      checks: { database_connection: 'ok', redis_cache: 'ok', worker_engine: 'ready', ai_engine: 'ready' }
    });
  });

  app.get('/api/v1/health/detailed', (req, res) => {
    res.json({
      status: 'healthy',
      uptime_seconds: Math.round(process.uptime()),
      environment: 'development',
      database: { status: 'ok', driver: 'postgresql+psycopg2', active_connections: 4, max_connections: 20 },
      cache: { status: 'ok', provider: 'redis', hit_rate_percent: 98.4 },
      scanner_workers: { status: 'operational', active_workers: 3, tools: ['zap', 'nmap', 'nikto'] },
      system_resources: { cpu_usage_percent: 14.2, memory_usage_percent: 41.5, disk_free_gb: 164.2, disk_total_gb: 200.0 },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/v1/metrics', (req, res) => {
    const uptime = Math.round(process.uptime());
    const prometheusText = `# HELP owasp_uptime_seconds Total runtime of OWASP_SCAN_PRO backend service in seconds.\n# TYPE owasp_uptime_seconds counter\nowasp_uptime_seconds ${uptime}\n\n# HELP owasp_system_cpu_usage_percent System CPU utilization percentage.\n# TYPE owasp_system_cpu_usage_percent gauge\nowasp_system_cpu_usage_percent 14.2\n\n# HELP owasp_system_memory_usage_percent System RAM memory utilization percentage.\n# TYPE owasp_system_memory_usage_percent gauge\nowasp_system_memory_usage_percent 41.5\n\n# HELP owasp_active_scans_total Total count of actively executing scanning jobs.\n# TYPE owasp_active_scans_total gauge\nowasp_active_scans_total 1\n\n# HELP owasp_docker_workers_count Number of Docker scanning workers by status.\n# TYPE owasp_docker_workers_count gauge\nowasp_docker_workers_count{tool="zap",status="RUNNING"} 1\nowasp_docker_workers_count{tool="nmap",status="IDLE"} 1\nowasp_docker_workers_count{tool="nikto",status="IDLE"} 1\n\n# HELP owasp_db_connections_active Number of active PostgreSQL database connections.\n# TYPE owasp_db_connections_active gauge\nowasp_db_connections_active 4\n`;
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusText);
  });

  app.get('/api/v1/system/status', (req, res) => {
    res.json({
      success: true,
      message: 'System status metrics retrieved',
      data: {
        cpu_percent: 14.2,
        memory_percent: 41.5,
        memory_used_mb: 6640.0,
        memory_total_mb: 16000.0,
        disk_percent: 17.9,
        disk_used_gb: 35.8,
        disk_total_gb: 200.0,
        uptime_seconds: Math.round(process.uptime()),
        active_db_connections: 4
      }
    });
  });

  app.get('/api/v1/system/workers', (req, res) => {
    res.json({
      success: true,
      message: 'Scan workers status retrieved',
      data: [
        { worker_id: 'wrk-zap-01', tool_name: 'zap', status: 'RUNNING', container_id: 'doc-container-8f92a1', current_target: 'https://test-target.org', cpu_percent: 18.4, memory_used_mb: 420.5, uptime_seconds: Math.round(process.uptime()) },
        { worker_id: 'wrk-nmap-01', tool_name: 'nmap', status: 'IDLE', container_id: 'doc-container-3e41b2', current_target: null, cpu_percent: 0.5, memory_used_mb: 64.2, uptime_seconds: Math.round(process.uptime()) },
        { worker_id: 'wrk-nikto-01', tool_name: 'nikto', status: 'IDLE', container_id: 'doc-container-9d10c4', current_target: null, cpu_percent: 0.2, memory_used_mb: 52.0, uptime_seconds: Math.round(process.uptime()) }
      ]
    });
  });

  app.get('/api/v1/system/security', (req, res) => {
    res.json({
      success: true,
      message: 'Security metrics overview retrieved',
      data: {
        failed_logins_24h: 3,
        active_sessions_count: 8,
        rbac_violations_24h: 1,
        rate_limit_blocks_24h: 0,
        last_security_audit_at: new Date().toISOString()
      }
    });
  });

  const mockErrorLogs = [
    { id: 'err-101', timestamp: new Date().toISOString(), level: 'WARNING', path: '/api/v1/scans', method: 'POST', status_code: 403, message: 'RBAC permission denied: Super Admin attempted scan launch.', exception_type: 'HTTPException', tenant_id: 'tenant-001', user_id: 'user-admin-01' },
    { id: 'err-102', timestamp: new Date().toISOString(), level: 'ERROR', path: '/api/v1/attachments/upload', method: 'POST', status_code: 400, message: 'File upload exceeds maximum allowed size threshold.', exception_type: 'ValueError', tenant_id: 'tenant-002', user_id: 'user-dev-02' }
  ];

  app.get('/api/v1/system/errors', (req, res) => {
    res.json({
      success: true,
      message: 'Error logs retrieved',
      data: mockErrorLogs
    });
  });

  const mockBackups = [
    { id: 'bkp-20260725-01', filename: 'owasp_scan_pro_db_20260725_020000.sql.gz', backup_type: 'DATABASE', size_mb: 42.8, sha256_hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0', status: 'VERIFIED', created_at: new Date().toISOString() },
    { id: 'bkp-20260725-02', filename: 'owasp_scan_pro_reports_20260725_030000.tar.gz', backup_type: 'REPORTS', size_mb: 118.4, sha256_hash: '8f7e6d5c4b3a210987654321fedcba987654321fedcba987654321fedcba9876', status: 'VERIFIED', created_at: new Date().toISOString() }
  ];

  app.get('/api/v1/system/backups', (req, res) => {
    res.json({
      success: true,
      message: 'Backups list retrieved',
      data: mockBackups
    });
  });

  app.post('/api/v1/system/backups', (req, res) => {
    const { backup_type } = req.body;
    const newBkp = {
      id: `bkp-${Date.now().toString().slice(-6)}`,
      filename: `owasp_scan_pro_${(backup_type || 'full').toLowerCase()}_${Date.now()}.tar.gz`,
      backup_type: backup_type || 'FULL',
      size_mb: 64.5,
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'VERIFIED',
      created_at: new Date().toISOString()
    };
    mockBackups.unshift(newBkp);
    res.status(201).json({
      success: true,
      message: 'Backup snapshot created successfully',
      data: newBkp
    });
  });

  app.post('/api/v1/system/backups/:id/restore', (req, res) => {
    res.json({
      success: true,
      message: 'Backup restore simulation executed',
      data: {
        backup_id: req.params.id,
        status: 'SUCCESS',
        verification_passed: true,
        sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        details: 'Database & report volume successfully restored and SHA-256 verified.',
        restored_at: new Date().toISOString()
      }
    });
  });

  // Mock scan storage for live dev preview
  const mockScans: any[] = [
    {
      id: 's4-0010-482a-bbf1-987123456789',
      company_id: 'tenant-001',
      target_id: 'target-001',
      auditor_id: 'auditor-001',
      status: 'COMPLETED',
      progress: 100,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 1800000).toISOString(),
      error_message: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      tool_executions: [
        { id: 'te-1', tool_type: 'ZAP', status: 'COMPLETED', progress: 100, return_code: 0, logs: '[ZAP] Completed 3 alerts' },
        { id: 'te-2', tool_type: 'NMAP', status: 'COMPLETED', progress: 100, return_code: 0, logs: '[NMAP] Completed 2 alerts' },
        { id: 'te-3', tool_type: 'NIKTO', status: 'COMPLETED', progress: 100, return_code: 0, logs: '[NIKTO] Completed 2 alerts' }
      ]
    }
  ];

  const mockFindings: any[] = [
    {
      id: 'find-001',
      scan_job_id: 's4-0010-482a-bbf1-987123456789',
      scanner_name: 'ZAP',
      title: 'SQL Injection in Search Query Parameter',
      severity: 'High',
      description: 'Blind SQL injection detected on parameter q in search endpoint.',
      http_request: 'GET /api/v1/search?q=1%27%20OR%201=1-- HTTP/1.1\r\nHost: target-app.com',
      http_response: 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n[{"id": 1, "admin": true}]',
      evidence_notes: 'Parameter q returned database error trace when injected with single quote.',
      raw_data: { plugin_id: '40018', cwe_id: '89', confidence: 'High' },
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'find-002',
      scan_job_id: 's4-0010-482a-bbf1-987123456789',
      scanner_name: 'NMAP',
      title: 'Exposed Administrative HTTP Service Port 8000',
      severity: 'Medium',
      description: 'Port 8000/tcp is open running FastAPI/Uvicorn server with exposed API endpoints.',
      http_request: 'Nmap Port Scan Target: target-app.com:8000',
      http_response: 'Port 8000/tcp OPEN service http-alt (uvicorn)',
      evidence_notes: 'Port 8000 responding directly without reverse proxy TLS termination.',
      raw_data: { port: 8000, protocol: 'tcp', service: 'http-alt' },
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'find-003',
      scan_job_id: 's4-0010-482a-bbf1-987123456789',
      scanner_name: 'NIKTO',
      title: 'Unprotected Git Repository / .git Directory Accessible',
      severity: 'Medium',
      description: 'Exposed .git configuration directory discovered at target root level.',
      http_request: 'GET /.git/config HTTP/1.1\r\nHost: target-app.com',
      http_response: 'HTTP/1.1 200 OK\r\n[core]\r\nrepositoryformatversion = 0',
      evidence_notes: 'Direct HTTP request returned valid Git configuration file.',
      raw_data: { nikto_id: '004012', path: '/.git/config' },
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  const mockVulnerabilities: any[] = [
    {
      id: 'v-001',
      company_id: 'tenant-001',
      finding_id: 'f-001',
      title: 'SQL Injection in Search Query Parameter',
      severity: 'HIGH',
      cvss: 8.5,
      cwe: 'CWE-89',
      owasp_category: 'A03:2021-Injection',
      status: 'ASSIGNED',
      due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
      remediation_sla_days: 14,
      is_overdue: false,
      assigned_employee_name: 'Dev Lead (Employee)',
      assigned_employee_id: 'emp-001',
      description: 'Blind SQL injection vulnerability detected on parameter q in the /api/v1/search endpoint.',
      recommendation: 'Use parameterized queries / prepared statements or ORM mapping to prevent SQL injection.',
      comments: [
        {
          id: 'c-001',
          vulnerability_id: 'v-001',
          author_id: 'emp-001',
          author_name: 'Dev Lead',
          author_role: 'EMPLOYEE',
          content: 'I have started applying parameterized queries on the search repository.',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      history: [
        {
          id: 'h-001',
          vulnerability_id: 'v-001',
          changed_by_user_id: 'u-002',
          changed_by_name: 'Auditor User',
          old_status: 'NEW',
          new_status: 'ASSIGNED',
          change_summary: 'Assigned to Dev Lead for remediation',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'v-002',
      company_id: 'tenant-001',
      finding_id: 'f-002',
      title: 'Exposed Administrative HTTP Service Port 8000',
      severity: 'MEDIUM',
      cvss: 5.3,
      cwe: 'CWE-200',
      owasp_category: 'A05:2021-Security Misconfiguration',
      status: 'IN_PROGRESS',
      due_date: new Date(Date.now() + 25 * 86400000).toISOString(),
      remediation_sla_days: 30,
      is_overdue: false,
      assigned_employee_name: 'SysAdmin Employee',
      assigned_employee_id: 'emp-002',
      description: 'Port 8000/tcp is open running FastAPI/Uvicorn without firewall restrictions.',
      recommendation: 'Restrict access using firewall rules or security groups to internal IPs only.',
      comments: [],
      history: [],
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'v-003',
      company_id: 'tenant-001',
      finding_id: 'f-003',
      title: 'X-Frame-Options Missing Security Header',
      severity: 'LOW',
      cvss: 3.1,
      cwe: 'CWE-1021',
      owasp_category: 'A05:2021-Security Misconfiguration',
      status: 'RESOLVED',
      due_date: new Date(Date.now() + 50 * 86400000).toISOString(),
      remediation_sla_days: 60,
      is_overdue: false,
      assigned_employee_name: 'Dev Lead (Employee)',
      assigned_employee_id: 'emp-001',
      description: 'Clickjacking defense missing header X-Frame-Options.',
      recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN in reverse proxy Nginx configuration.',
      comments: [],
      history: [],
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString()
    }
  ];

  const mockNotifications: any[] = [
    {
      id: 'n-001',
      user_id: 'u-001',
      type: 'VULNERABILITY_ASSIGNED',
      title: 'New Vulnerability Task Assigned',
      message: 'You have been assigned to remediate [HIGH] SQL Injection in Search Query Parameter.',
      is_read: false,
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'n-002',
      user_id: 'u-001',
      type: 'SCAN_COMPLETED',
      title: 'Scan Job #s4-0010 Completed',
      message: 'Scan Job #s4-0010 finished with 3 findings analyzed.',
      is_read: true,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const mockReports: any[] = [
    {
      id: 'rep-001',
      company_id: 'tenant-001',
      scan_job_id: 's4-0010-482a-bbf1-987123456789',
      title: 'OWASP_SCAN_PRO Executive Security Audit Report',
      version: '1.0',
      report_format: 'PDF',
      owasp_category: 'A01, A03, A05',
      file_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      pdf_path: '/tmp/reports/rep-001.pdf',
      summary: 'Audit Report v1.0 generated with 3 consolidated vulnerabilities. Non-repudiation verified via SHA-256.',
      html_content: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;}.card{background:#1e293b;padding:20px;border-radius:8px;border:1px solid #334155;margin-bottom:15px;}.badge{background:#f43f5e;color:white;padding:2px 8px;border-radius:4px;font-size:12px;}</style></head><body><div class="card"><h1>OWASP_SCAN_PRO Security Audit Report</h1><p>Tenant: Acme Cyber PME | Target: https://app.victim-corp.com</p><p>Version: 1.0 | SHA-256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</p></div><div class="card"><span class="badge">HIGH</span><h3>1. SQL Injection in Search Query Parameter</h3><p>Blind SQL injection detected on parameter q in search endpoint.</p><pre style="background:#020617;padding:10px;color:#38bdf8;">GET /api/v1/search?q=1%27%20OR%201=1-- HTTP/1.1</pre></div><div class="card"><span class="badge" style="background:#f59e0b;">MEDIUM</span><h3>2. Exposed Administrative HTTP Service Port 8000</h3><p>Port 8000/tcp is open running FastAPI/Uvicorn server.</p></div></body></html>`,
      json_content: JSON.stringify({
        metadata: {
          title: 'OWASP_SCAN_PRO Security Audit Report',
          version: '1.0',
          scan_job_id: 's4-0010-482a-bbf1-987123456789'
        },
        findings_count: 3
      }, null, 2),
      created_at: new Date(Date.now() - 900000).toISOString(),
      updated_at: new Date(Date.now() - 900000).toISOString()
    }
  ];

  app.post('/api/v1/scans', (req, res) => {
    const { target_id, tools } = req.body;
    const newScan = {
      id: 's4-' + Math.random().toString(36).substring(2, 10),
      company_id: 'tenant-001',
      target_id: target_id || 'target-001',
      auditor_id: 'auditor-001',
      status: 'RUNNING',
      progress: 25,
      started_at: new Date().toISOString(),
      completed_at: null,
      error_message: null,
      created_at: new Date().toISOString(),
      tool_executions: (tools || ['zap', 'nmap', 'nikto']).map((t: string, idx: number) => ({
        id: `te-${idx}-${Date.now()}`,
        tool_type: t.toUpperCase(),
        status: 'RUNNING',
        progress: 30,
        logs: `[${t.toUpperCase()}] Worker started execution...`
      }))
    };
    mockScans.unshift(newScan);
    res.status(201).json({
      success: true,
      message: 'Scan job created and execution triggered successfully.',
      data: newScan
    });
  });

  app.get('/api/v1/scans', (req, res) => {
    res.json({
      success: true,
      message: 'Scan history retrieved successfully.',
      data: {
        items: mockScans,
        total: mockScans.length,
        page: 1,
        size: 20
      }
    });
  });

  app.get('/api/v1/scans/:id', (req, res) => {
    const scan = mockScans.find(s => s.id === req.params.id) || mockScans[0];
    res.json({
      success: true,
      message: 'Scan job details retrieved successfully.',
      data: scan
    });
  });

  app.get('/api/v1/scans/:id/status', (req, res) => {
    const scan = mockScans.find(s => s.id === req.params.id) || mockScans[0];
    res.json({
      success: true,
      message: 'Scan progress status retrieved successfully.',
      data: {
        scan_id: scan.id,
        status: scan.status,
        progress: scan.progress,
        zap: 'completed',
        nmap: 'running',
        nikto: 'pending'
      }
    });
  });

  app.post('/api/v1/scans/:id/cancel', (req, res) => {
    const scan = mockScans.find(s => s.id === req.params.id);
    if (scan) {
      scan.status = 'CANCELLED';
      scan.progress = scan.progress || 50;
      scan.tool_executions.forEach((t: any) => {
        if (t.status === 'RUNNING' || t.status === 'PENDING') {
          t.status = 'CANCELLED';
        }
      });
    }
    res.json({
      success: true,
      message: 'Scan job cancelled successfully.',
      data: scan || mockScans[0]
    });
  });

  app.get('/api/v1/findings', (req, res) => {
    res.json({
      success: true,
      message: 'Raw findings list retrieved successfully.',
      data: {
        items: mockFindings,
        total: mockFindings.length,
        page: 1,
        size: 20
      }
    });
  });

  app.get('/api/v1/findings/:id', (req, res) => {
    const finding = mockFindings.find(f => f.id === req.params.id) || mockFindings[0];
    res.json({
      success: true,
      message: 'Finding evidence details retrieved successfully.',
      data: finding
    });
  });

  // Sprint 6: Report Engine Endpoints
  app.post('/api/v1/reports', (req, res) => {
    const { scan_job_id, title, report_format, owasp_categories } = req.body;
    const version = `${mockReports.filter(r => r.scan_job_id === scan_job_id).length + 1}.0`;
    const reportId = 'rep-' + Math.random().toString(36).substring(2, 10);
    const mockHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    const newReport = {
      id: reportId,
      company_id: 'tenant-001',
      scan_job_id: scan_job_id || 's4-0010-482a-bbf1-987123456789',
      title: title || 'OWASP_SCAN_PRO Security Audit Report',
      version: version,
      report_format: report_format || 'PDF',
      owasp_category: owasp_categories ? owasp_categories.join(', ') : 'A01, A03, A05',
      file_hash: mockHash,
      pdf_path: `/tmp/reports/${reportId}.pdf`,
      summary: `Audit Report v${version} generated with ${mockFindings.length} vulnerabilities. Non-repudiation SHA-256 signature verified.`,
      html_content: `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;}.card{background:#1e293b;padding:20px;border-radius:8px;border:1px solid #334155;margin-bottom:15px;}.badge{background:#f43f5e;color:white;padding:2px 8px;border-radius:4px;font-size:12px;}</style></head><body><div class="card"><h1>${title || 'OWASP_SCAN_PRO Audit Report'}</h1><p>Version: ${version} | SHA-256: ${mockHash}</p></div><div class="card"><span class="badge">HIGH</span><h3>SQL Injection in Search Query Parameter</h3><p>Blind SQL injection on search query endpoint.</p></div></body></html>`,
      json_content: JSON.stringify({ metadata: { title, version, file_hash: mockHash }, findings: mockFindings }, null, 2),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockReports.unshift(newReport);

    res.status(201).json({
      success: true,
      message: 'Security report generated successfully with SHA-256 signature.',
      data: newReport
    });
  });

  app.get('/api/v1/reports', (req, res) => {
    res.json({
      success: true,
      message: 'Tenant security reports history retrieved successfully.',
      data: {
        items: mockReports,
        total: mockReports.length,
        page: 1,
        size: 20
      }
    });
  });

  app.get('/api/v1/reports/:id', (req, res) => {
    const report = mockReports.find(r => r.id === req.params.id) || mockReports[0];
    res.json({
      success: true,
      message: 'Report details retrieved successfully.',
      data: report
    });
  });

  app.get('/api/v1/reports/:id/download', (req, res) => {
    const report = mockReports.find(r => r.id === req.params.id) || mockReports[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${report.id}_${report.version}.pdf"`);
    res.setHeader('X-Report-SHA256', report.file_hash);
    
    const dummyPdfContent = `%PDF-1.4\n1 0 obj\n<< /Title (${report.title}) /SHA256 (${report.file_hash}) >>\nendobj\n%%EOF`;
    res.send(Buffer.from(dummyPdfContent));
  });

  app.get('/api/v1/reports/:id/html', (req, res) => {
    const report = mockReports.find(r => r.id === req.params.id) || mockReports[0];
    res.setHeader('Content-Type', 'text/html');
    res.send(report.html_content);
  });

  app.get('/api/v1/reports/:id/hash', (req, res) => {
    const report = mockReports.find(r => r.id === req.params.id) || mockReports[0];
    res.json({
      success: true,
      message: 'Report SHA-256 non-repudiation signature verified.',
      data: {
        report_id: report.id,
        file_hash: report.file_hash,
        algorithm: 'SHA-256',
        verified: true,
        created_at: report.created_at
      }
    });
  });

  // Sprint 7: Vulnerability Management & Notifications Endpoints
  app.get('/api/v1/vulnerabilities', (req, res) => {
    let filtered = [...mockVulnerabilities];
    const { severity, status, employee_id, owasp_category, q } = req.query;

    if (severity) filtered = filtered.filter(v => v.severity.toUpperCase() === String(severity).toUpperCase());
    if (status) filtered = filtered.filter(v => v.status.toUpperCase() === String(status).toUpperCase());
    if (employee_id) filtered = filtered.filter(v => v.assigned_employee_id === String(employee_id));
    if (owasp_category) filtered = filtered.filter(v => v.owasp_category?.toLowerCase().includes(String(owasp_category).toLowerCase()));
    if (q) {
      const search = String(q).toLowerCase();
      filtered = filtered.filter(v => v.title.toLowerCase().includes(search) || v.cwe?.toLowerCase().includes(search));
    }

    res.json({
      success: true,
      message: 'Vulnerabilities list retrieved successfully.',
      data: {
        items: filtered,
        total: filtered.length,
        page: 1,
        size: 20
      }
    });
  });

  app.get('/api/v1/vulnerabilities/remediation-policies/default', (req, res) => {
    res.json({
      success: true,
      message: 'Remediation SLA policy configured.',
      data: {
        critical_sla_days: 7,
        high_sla_days: 14,
        medium_sla_days: 30,
        low_sla_days: 60,
        info_sla_days: 90
      }
    });
  });

  app.get('/api/v1/vulnerabilities/:id', (req, res) => {
    const vuln = mockVulnerabilities.find(v => v.id === req.params.id) || mockVulnerabilities[0];
    res.json({
      success: true,
      message: 'Vulnerability detail retrieved successfully.',
      data: vuln
    });
  });

  app.patch('/api/v1/vulnerabilities/:id', (req, res) => {
    const vuln = mockVulnerabilities.find(v => v.id === req.params.id) || mockVulnerabilities[0];
    const { status, summary } = req.body;
    const oldStatus = vuln.status;
    vuln.status = status || vuln.status;
    vuln.updated_at = new Date().toISOString();

    vuln.history.unshift({
      id: 'h-' + Math.random().toString(36).substring(2, 8),
      vulnerability_id: vuln.id,
      changed_by_user_id: 'current-user-id',
      changed_by_name: 'Current User',
      old_status: oldStatus,
      new_status: vuln.status,
      change_summary: summary || `Status transitioned to ${vuln.status}`,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Vulnerability status updated to ${vuln.status}.`,
      data: vuln
    });
  });

  app.post('/api/v1/vulnerabilities/:id/assign', (req, res) => {
    const vuln = mockVulnerabilities.find(v => v.id === req.params.id) || mockVulnerabilities[0];
    const { employee_id, notes } = req.body;

    vuln.assigned_employee_id = employee_id || 'emp-001';
    vuln.assigned_employee_name = employee_id === 'emp-002' ? 'SysAdmin Employee' : 'Dev Lead (Employee)';
    if (vuln.status === 'NEW') vuln.status = 'ASSIGNED';
    vuln.updated_at = new Date().toISOString();

    vuln.history.unshift({
      id: 'h-' + Math.random().toString(36).substring(2, 8),
      vulnerability_id: vuln.id,
      changed_by_user_id: 'current-user-id',
      changed_by_name: 'Auditor User',
      old_status: 'NEW',
      new_status: vuln.status,
      change_summary: `Assigned to ${vuln.assigned_employee_name}. Notes: ${notes || 'N/A'}`,
      created_at: new Date().toISOString()
    });

    // Create notification
    mockNotifications.unshift({
      id: 'n-' + Math.random().toString(36).substring(2, 8),
      user_id: vuln.assigned_employee_id,
      type: 'VULNERABILITY_ASSIGNED',
      title: 'New Vulnerability Task Assigned',
      message: `You have been assigned to remediate [${vuln.severity}] ${vuln.title}.`,
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Vulnerability task assigned successfully.',
      data: vuln
    });
  });

  app.post('/api/v1/vulnerabilities/:id/comment', (req, res) => {
    const vuln = mockVulnerabilities.find(v => v.id === req.params.id) || mockVulnerabilities[0];
    const { content } = req.body;

    const newComment = {
      id: 'c-' + Math.random().toString(36).substring(2, 8),
      vulnerability_id: vuln.id,
      author_id: 'current-user-id',
      author_name: 'Auditor User',
      author_role: 'AUDITOR',
      content: content || 'Status update discussion note.',
      created_at: new Date().toISOString()
    };

    vuln.comments.push(newComment);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: newComment
    });
  });

  app.get('/api/v1/notifications', (req, res) => {
    res.json({
      success: true,
      message: 'Notifications retrieved successfully.',
      data: {
        items: mockNotifications,
        total: mockNotifications.length,
        page: 1,
        size: 20
      }
    });
  });

  app.patch('/api/v1/notifications/:id/read', (req, res) => {
    const notif = mockNotifications.find(n => n.id === req.params.id);
    if (notif) notif.is_read = true;
    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: { id: req.params.id, is_read: true }
    });
  });

  app.post('/api/v1/notifications/read-all', (req, res) => {
    mockNotifications.forEach(n => n.is_read = true);
    res.json({
      success: true,
      message: 'All notifications marked as read.',
      data: { count: mockNotifications.length }
    });
  });

  app.get('/api/v1/dashboards/admin', (req, res) => {
    res.json({
      success: true,
      message: 'Super Admin metrics retrieved successfully.',
      data: {
        total_tenants: 1,
        total_users: 12,
        total_scans: 8,
        total_vulnerabilities: mockVulnerabilities.length,
        active_remediations: 2,
        overdue_slas: 0,
        remediation_rate: 33.3,
        security_score: 82,
        security_grade: 'B',
        severity_distribution: { critical: 0, high: 1, medium: 1, low: 1, info: 0 },
        status_distribution: { new: 0, assigned: 1, in_progress: 1, resolved: 1, verified: 0, closed: 0, reopened: 0 }
      }
    });
  });

  app.get('/api/v1/dashboards/auditor', (req, res) => {
    res.json({
      success: true,
      message: 'Auditor metrics retrieved successfully.',
      data: {
        assigned_targets: 3,
        total_scans_executed: 8,
        vulnerabilities_discovered: mockVulnerabilities.length,
        pending_verifications: 1,
        security_score: 82,
        severity_distribution: { critical: 0, high: 1, medium: 1, low: 1, info: 0 }
      }
    });
  });

  app.get('/api/v1/dashboards/employee', (req, res) => {
    res.json({
      success: true,
      message: 'Employee metrics retrieved successfully.',
      data: {
        assigned_vulnerabilities: 2,
        in_progress_count: 1,
        resolved_count: 1,
        overdue_count: 0,
        security_score: 85,
        severity_distribution: { critical: 0, high: 1, medium: 0, low: 1, info: 0 }
      }
    });
  });

  // Sprint 8: Analytics Endpoints
  app.get('/api/v1/analytics/security-score', (req, res) => {
    res.json({
      success: true,
      message: 'Global security score calculated successfully.',
      data: {
        score: 82,
        grade: 'B',
        trend_delta: 4.2,
        risk_level: 'MEDIUM',
        penalty_breakdown: {
          critical: 0,
          high: 15,
          medium: 4,
          low: 1,
          overdue_slas: 0
        },
        historical_scores: [
          { date: 'Jul 19', score: 72 },
          { date: 'Jul 20', score: 74 },
          { date: 'Jul 21', score: 75 },
          { date: 'Jul 22', score: 78 },
          { date: 'Jul 23', score: 79 },
          { date: 'Jul 24', score: 80 },
          { date: 'Jul 25', score: 82 }
        ]
      }
    });
  });

  app.get('/api/v1/analytics/owasp-breakdown', (req, res) => {
    res.json({
      success: true,
      message: 'OWASP category distribution retrieved successfully.',
      data: {
        total_findings: mockVulnerabilities.length,
        categories: [
          { code: 'A01', name: 'A01:2021-Broken Access Control', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A02', name: 'A02:2021-Cryptographic Failures', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A03', name: 'A03:2021-Injection', count: 1, percentage: 33.3, critical_count: 0 },
          { code: 'A04', name: 'A04:2021-Insecure Design', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A05', name: 'A05:2021-Security Misconfiguration', count: 2, percentage: 66.7, critical_count: 0 },
          { code: 'A06', name: 'A06:2021-Vulnerable Components', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A07', name: 'A07:2021-Identification & Auth Failures', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A08', name: 'A08:2021-Software Data Integrity Failures', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A09', name: 'A09:2021-Security Logging & Monitoring Failures', count: 0, percentage: 0, critical_count: 0 },
          { code: 'A10', name: 'A10:2021-Server-Side Request Forgery', count: 0, percentage: 0, critical_count: 0 }
        ]
      }
    });
  });

  app.get('/api/v1/analytics/trends', (req, res) => {
    res.json({
      success: true,
      message: 'Historical analytics trends retrieved successfully.',
      data: {
        period: 'Last 14 days',
        trend: [
          { date: 'Jul 12', scans_count: 1, discovered: 0, resolved: 0 },
          { date: 'Jul 14', scans_count: 2, discovered: 1, resolved: 0 },
          { date: 'Jul 16', scans_count: 1, discovered: 1, resolved: 1 },
          { date: 'Jul 18', scans_count: 2, discovered: 1, resolved: 0 },
          { date: 'Jul 20', scans_count: 1, discovered: 0, resolved: 1 },
          { date: 'Jul 22', scans_count: 3, discovered: 2, resolved: 1 },
          { date: 'Jul 25', scans_count: 2, discovered: 0, resolved: 1 }
        ]
      }
    });
  });

  app.get('/api/v1/analytics/scanner-stats', (req, res) => {
    res.json({
      success: true,
      message: 'Scanner engine performance stats retrieved successfully.',
      data: {
        tools: [
          { tool_name: 'OWASP ZAP', total_runs: 8, findings_count: 18, avg_duration_seconds: 42.5, success_rate: 100.0 },
          { tool_name: 'Nmap Port Scanner', total_runs: 8, findings_count: 6, avg_duration_seconds: 12.1, success_rate: 100.0 },
          { tool_name: 'Nikto Web Scanner', total_runs: 8, findings_count: 9, avg_duration_seconds: 28.4, success_rate: 100.0 }
        ]
      }
    });
  });

  app.get('/api/v1/analytics/realtime-feed', (req, res) => {
    res.json({
      success: true,
      message: 'Real-time telemetry event stream retrieved.',
      data: {
        active_scans_count: 1,
        open_critical_count: 0,
        pending_verifications_count: 1,
        events: [
          {
            id: 'evt-1',
            timestamp: new Date().toLocaleTimeString(),
            event_type: 'vulnerability_update',
            severity: 'HIGH',
            title: 'Vulnerability ASSIGNED: Blind SQL Injection',
            description: 'Assigned to Dev Lead (Employee) • OWASP: A03:2021-Injection'
          },
          {
            id: 'evt-2',
            timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
            event_type: 'scan_completed',
            severity: 'INFO',
            title: 'Scan Job Completed for target https://app.victim-corp.com',
            description: 'OWASP ZAP & Nmap finished in 54s with 3 findings'
          },
          {
            id: 'evt-3',
            timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
            event_type: 'remediation_status',
            severity: 'LOW',
            title: 'Vulnerability RESOLVED: X-Frame-Options Missing Security Header',
            description: 'Marked RESOLVED by Dev Lead • Pending auditor verification'
          }
        ]
      }
    });
  });

  // --- SPRINT 9: COLLABORATION & COMMUNICATION ENDPOINTS ---
  const mockThreads: any[] = [
    {
      id: 'thr-001',
      vulnerability_id: 'v-001',
      subject: 'Discussion : Injection SQL dans le paramètre de recherche',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      messages: [
        {
          id: 'msg-001',
          thread_id: 'thr-001',
          sender_id: 'u-002',
          sender_name: 'Auditeur Sécurité',
          sender_role: 'AUDITOR',
          content: 'Bonjour @Dev, veuillez vérifier le journal de payload SQL joint dans les constatations avant de déployer le correctif.',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'msg-002',
          thread_id: 'thr-001',
          sender_id: 'emp-001',
          sender_name: 'Dev Lead',
          sender_role: 'EMPLOYEE',
          content: 'Bien reçu @Auditeur, je remplace les requêtes SQL directes par des instructions paramétrées via l\'ORM SQLAlchemy.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    }
  ];

  const mockAttachments: any[] = [
    {
      id: 'att-001',
      company_id: 'tenant-001',
      uploader_id: 'u-002',
      uploader_name: 'Auditeur Sécurité',
      resource_type: 'vulnerability',
      resource_id: 'v-001',
      filename: 'sqli_proof_payload.pcap',
      file_type: 'application/x-pcap',
      file_size: 142050,
      file_path: '/uploads/tenant-001/sqli_proof_payload.pcap',
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const mockActivities: any[] = [
    {
      id: 'act-001',
      company_id: 'tenant-001',
      user_id: 'u-002',
      user_name: 'Auditeur Sécurité',
      user_role: 'AUDITOR',
      action: 'THREAD_CREATED',
      resource_type: 'vulnerability',
      resource_id: 'v-001',
      summary: 'Fil de discussion créé : Injection SQL dans le paramètre de recherche',
      details: null,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'act-002',
      company_id: 'tenant-001',
      user_id: 'u-002',
      user_name: 'Auditeur Sécurité',
      user_role: 'AUDITOR',
      action: 'ATTACHMENT_UPLOADED',
      resource_type: 'vulnerability',
      resource_id: 'v-001',
      summary: 'Fichier de preuve téléversé : sqli_proof_payload.pcap (142 Ko, SHA256 : e3b0c442...)',
      details: 'MIME : application/x-pcap',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'act-003',
      company_id: 'tenant-001',
      user_id: 'emp-001',
      user_name: 'Dev Lead',
      user_role: 'EMPLOYEE',
      action: 'COMMENT_CREATED',
      resource_type: 'vulnerability',
      resource_id: 'v-001',
      summary: 'Commentaire sur la vulnérabilité Injection SQL dans le paramètre de recherche',
      details: 'J\'ai commencé à appliquer les requêtes paramétrées dans le dépôt de recherche.',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const mockReportComments: Record<string, any[]> = {
    'rep-001': [
      {
        id: 'rc-001',
        report_id: 'rep-001',
        author_id: 'u-002',
        author_name: 'Auditeur Sécurité',
        author_role: 'AUDITOR',
        content: 'Rapport vérifié. Toutes les vulnérabilités du Top 10 OWASP sont correctement cartographiées.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  };

  // Messaging Routes
  app.get('/api/v1/messaging/threads', (req, res) => {
    res.json(mockThreads);
  });

  app.post('/api/v1/messaging/threads', (req, res) => {
    const { vulnerability_id, subject, initial_message } = req.body;
    const newThread = {
      id: `thr-${Date.now().toString().slice(-4)}`,
      vulnerability_id: vulnerability_id || 'v-001',
      subject: subject || 'New Vulnerability Thread',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };
    if (initial_message) {
      newThread.messages.push({
        id: `msg-${Date.now().toString().slice(-4)}`,
        thread_id: newThread.id,
        sender_id: 'emp-001',
        sender_name: 'Current User',
        sender_role: 'EMPLOYEE',
        content: initial_message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    mockThreads.unshift(newThread);
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      company_id: 'tenant-001',
      user_id: 'emp-001',
      user_name: 'Current User',
      user_role: 'EMPLOYEE',
      action: 'THREAD_CREATED',
      resource_type: 'vulnerability',
      resource_id: newThread.vulnerability_id,
      summary: `Created discussion thread: ${newThread.subject}`,
      details: initial_message || null,
      created_at: new Date().toISOString()
    });
    res.status(201).json(newThread);
  });

  app.get('/api/v1/messaging/threads/:id', (req, res) => {
    const thr = mockThreads.find(t => t.id === req.params.id) || mockThreads[0];
    res.json(thr);
  });

  app.post('/api/v1/messaging/messages', (req, res) => {
    const { thread_id, content } = req.body;
    const thr = mockThreads.find(t => t.id === thread_id) || mockThreads[0];
    const newMsg = {
      id: `msg-${Date.now().toString().slice(-4)}`,
      thread_id: thr.id,
      sender_id: 'emp-001',
      sender_name: 'Current User',
      sender_role: 'EMPLOYEE',
      content: content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    thr.messages.push(newMsg);
    thr.updated_at = new Date().toISOString();
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      company_id: 'tenant-001',
      user_id: 'emp-001',
      user_name: 'Current User',
      user_role: 'EMPLOYEE',
      action: 'MESSAGE_SENT',
      resource_type: 'thread',
      resource_id: thr.id,
      summary: `Sent message in thread '${thr.subject}'`,
      details: content,
      created_at: new Date().toISOString()
    });
    res.status(201).json(newMsg);
  });

  // Attachments Routes
  app.get('/api/v1/attachments', (req, res) => {
    res.json(mockAttachments);
  });

  app.post('/api/v1/attachments/upload', (req, res) => {
    const { resource_type, resource_id } = req.query;
    const newAtt = {
      id: `att-${Date.now().toString().slice(-4)}`,
      company_id: 'tenant-001',
      uploader_id: 'emp-001',
      uploader_name: 'Current User',
      resource_type: resource_type || 'vulnerability',
      resource_id: resource_id || 'v-001',
      filename: 'remediation_evidence_log.txt',
      file_type: 'text/plain',
      file_size: 24500,
      file_path: '/uploads/tenant-001/remediation_evidence_log.txt',
      sha256_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      created_at: new Date().toISOString()
    };
    mockAttachments.unshift(newAtt);
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      company_id: 'tenant-001',
      user_id: 'emp-001',
      user_name: 'Current User',
      user_role: 'EMPLOYEE',
      action: 'ATTACHMENT_UPLOADED',
      resource_type: newAtt.resource_type,
      resource_id: newAtt.resource_id,
      summary: `Uploaded proof file: ${newAtt.filename} (24.5 KB)`,
      details: 'MIME: text/plain • SHA256 verified',
      created_at: new Date().toISOString()
    });
    res.status(201).json(newAtt);
  });

  app.delete('/api/v1/attachments/:id', (req, res) => {
    const idx = mockAttachments.findIndex(a => a.id === req.params.id);
    if (idx !== -1) mockAttachments.splice(idx, 1);
    res.status(204).send();
  });

  // Activity Routes
  app.get('/api/v1/activity', (req, res) => {
    res.json(mockActivities);
  });

  // Report Comments Routes
  app.get('/api/v1/reports/:id/comments', (req, res) => {
    const list = mockReportComments[req.params.id] || [];
    res.json({
      success: true,
      message: 'Report comments retrieved.',
      data: list
    });
  });

  app.post('/api/v1/reports/:id/comment', (req, res) => {
    const { content } = req.body;
    const reportId = req.params.id;
    if (!mockReportComments[reportId]) mockReportComments[reportId] = [];
    const newCmt = {
      id: `rc-${Date.now().toString().slice(-4)}`,
      report_id: reportId,
      author_id: 'emp-001',
      author_name: 'Current User',
      author_role: 'EMPLOYEE',
      content: content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockReportComments[reportId].push(newCmt);
    mockActivities.unshift({
      id: `act-${Date.now()}`,
      company_id: 'tenant-001',
      user_id: 'emp-001',
      user_name: 'Current User',
      user_role: 'EMPLOYEE',
      action: 'COMMENT_CREATED',
      resource_type: 'report',
      resource_id: reportId,
      summary: `Commented on report #${reportId}`,
      details: content,
      created_at: new Date().toISOString()
    });
    res.status(201).json({
      success: true,
      message: 'Comment added to report.',
      data: newCmt
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'OWASP_SCAN_PRO',
      version: '0.1.0',
      environment: 'development'
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OWASP_SCAN_PRO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
