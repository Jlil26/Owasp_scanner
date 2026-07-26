import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Server,
  Database,
  Cpu,
  Layers,
  HardDrive,
  Terminal,
  Copy,
  Check,
  Building2,
  Users,
  Target as TargetIcon,
  ScrollText,
  Crosshair,
  FileText,
  Bell,
  BarChart3,
  ShieldAlert,
  Play,
  Activity
} from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';
import { ScannerModule } from '../scanner/ScannerModule';
import { ReportModule } from '../reports/ReportModule';
import { VulnerabilityModule } from '../vulnerabilities/VulnerabilityModule';
import { NotificationModule } from '../notifications/NotificationModule';
import { BusinessDashboardModule } from '../dashboard/BusinessDashboardModule';
import { CollaborationCenterModule } from '../collaboration/CollaborationCenterModule';
import { MonitoringPlatformModule } from '../monitoring/MonitoringPlatformModule';
import { ReleaseCandidateModule } from '../release/ReleaseCandidateModule';
import { QAAuditModule } from '../qa/QAAuditModule';
import { MessageSquare, Award } from 'lucide-react';

export const BootstrapModule: React.FC = () => {
  const { data } = useHealth();
  const [activeTab, setActiveTab] = useState<'qa' | 'release' | 'monitoring' | 'collaboration' | 'dashboards' | 'vulnerabilities' | 'notifications' | 'scanner' | 'reports' | 'architecture'>('qa');
  const [copied, setCopied] = React.useState(false);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('python3 backend/run_tests.py');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sprint4Endpoints = [
    { method: 'GET', path: '/api/v1/analytics/security-score', desc: 'Calculate global 0-100 security score & risk grade' },
    { method: 'GET', path: '/api/v1/analytics/owasp-breakdown', desc: 'OWASP Top 10 category vulnerability distribution' },
    { method: 'GET', path: '/api/v1/analytics/trends', desc: 'Historical scan, discovery & resolution velocity trend' },
    { method: 'GET', path: '/api/v1/analytics/scanner-stats', desc: 'Performance and discovery stats per scanner tool' },
    { method: 'GET', path: '/api/v1/analytics/realtime-feed', desc: 'Realtime telemetry feed event stream & counters' },
    { method: 'GET', path: '/api/v1/dashboards/admin|auditor|employee', desc: 'Role-tailored KPI security supervision dashboards' },
  ];

  const sprint3Modules = [
    { name: 'Business Dashboards', desc: '3 distinct role dashboards (Super Admin, Auditor, Employee)', icon: BarChart3 },
    { name: 'Security Score Engine', desc: 'Weighted score calculation & penalty factor breakdown', icon: Crosshair },
    { name: 'OWASP Top 10 Analytics', desc: 'Category distribution & high risk concentration', icon: ShieldAlert },
    { name: 'Realtime Telemetry Feed', desc: 'Live event stream with SSE architecture readiness', icon: Bell },
  ];

  const services = [
    {
      name: 'backend_api',
      tech: 'FastAPI // Python 3.13',
      status: data?.status === 'ok' ? 'Online' : 'Ready',
      port: '8000',
      icon: Server,
      tag: 'FASTAPI:8000'
    },
    {
      name: 'frontend_web',
      tech: 'React 19 // TS // Vite',
      status: 'Online',
      port: '3000',
      icon: Layers,
      tag: 'VITE:3000'
    },
    {
      name: 'postgres_db',
      tech: 'PostgreSQL 16 // Alembic',
      status: 'Configured & Migrated',
      port: '5432',
      icon: Database,
      tag: 'DB:5432'
    },
    {
      name: 'redis_cache',
      tech: 'Redis 7 // Queue',
      status: 'Configured',
      port: '6379',
      icon: HardDrive,
      tag: 'CACHE:6379'
    },
    {
      name: 'nginx_proxy',
      tech: 'Nginx // Reverse Proxy',
      status: 'Configured',
      port: '80',
      icon: Cpu,
      tag: 'HTTP:80'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-between space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                OWASP_SCAN_PRO
              </h1>
              <p className="text-slate-500 text-xs font-mono">v0.8.0-sprint8 // Business Dashboards & Analytics Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-indigo-400 font-mono text-[11px] uppercase tracking-widest font-bold">Sprint 8 Active</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono text-[11px]">
              Role Dashboards • Security Score Engine • OWASP Analytics • Realtime Feed
            </div>
          </div>
        </header>

        {/* Module Navigation Tabs */}
        <nav className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('qa')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'qa'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-300" />
            <span>Final QA Certification (Sprint 12)</span>
          </button>

          <button
            onClick={() => setActiveTab('release')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'release'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-300" />
            <span>Release Candidate (Sprint 11)</span>
          </button>

          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'monitoring'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-300" />
            <span>Monitoring & Platform (Sprint 10)</span>
          </button>

          <button
            onClick={() => setActiveTab('collaboration')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'collaboration'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Collaboration Center</span>
          </button>

          <button
            onClick={() => setActiveTab('vulnerabilities')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'vulnerabilities'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Vulnerability Management</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'notifications'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Center</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboards')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'dashboards'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Business KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'reports'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Report Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'scanner'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Scanner Orchestrator</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'architecture'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Architecture & Stack</span>
          </button>
        </nav>

        {/* Tab Content Rendering */}
        <div className="my-2">
          {activeTab === 'qa' && <QAAuditModule />}
          {activeTab === 'release' && <ReleaseCandidateModule />}
          {activeTab === 'monitoring' && <MonitoringPlatformModule />}
          {activeTab === 'collaboration' && <CollaborationCenterModule />}
          {activeTab === 'vulnerabilities' && <VulnerabilityModule />}
          {activeTab === 'notifications' && <NotificationModule />}
          {activeTab === 'dashboards' && <BusinessDashboardModule />}
          {activeTab === 'reports' && <ReportModule />}
          {activeTab === 'scanner' && <ScannerModule />}

          {activeTab === 'architecture' && (
            <div className="grid grid-cols-12 gap-4 my-2">
              {/* Main Hero Card: Sprint 7 Active */}
              <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="relative z-10 space-y-4">
                  <div className="inline-block px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                    Sprint 7 – Vulnerability Management & Notification Center
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                    End-to-End Remediation Workflows & <br />
                    Business Security Intelligence
                  </h2>
                  <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
                    Full lifecycle vulnerability tracking (NEW -&gt; ASSIGNED -&gt; IN_PROGRESS -&gt; RESOLVED -&gt; VERIFIED/CLOSED or REOPENED), employee task assignments, remediation SLA compliance rules, internal notifications center, auditor verification gates, and role-tailored KPI dashboards.
                  </p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap gap-6 md:gap-10 z-10">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Company & Users</p>
                    <p className="text-emerald-400 font-mono text-xs md:text-sm font-semibold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Tenant Isolated
                    </p>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-slate-800"></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Remediation Policy</p>
                    <p className="text-sky-400 font-mono text-xs md:text-sm font-semibold flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" /> SLA Engine
                    </p>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-slate-800"></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Audit Trail</p>
                    <p className="text-indigo-400 font-mono text-xs md:text-sm font-semibold flex items-center gap-1.5">
                      <ScrollText className="w-3.5 h-3.5" /> Action Logged
                    </p>
                  </div>
                </div>

                <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
              </div>

              {/* Infrastructure Status */}
              <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" /> Infrastructure Stack
                    </h3>
                    <span className="text-[10px] bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800 font-mono text-indigo-400">
                      5 Containers
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {services.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                          <div>
                            <span className="text-xs font-mono font-medium text-slate-200 block">{s.name}</span>
                            <span className="text-[10px] text-slate-500">{s.tech}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{s.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modules Overview Card */}
              <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Sprint 7 Core Modules</span>
                  <span className="text-[10px] font-mono text-slate-500">Domain Architecture</span>
                </h3>
                <div className="space-y-2.5">
                  {sprint3Modules.map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <IconComponent className="w-4 h-4 text-cyan-400" />
                          <div>
                            <span className="text-xs font-mono font-bold text-cyan-300 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.desc}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API Specification Details */}
              <div className="col-span-12 md:col-span-6 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sprint 7 Endpoints & Controllers
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        VERIFIED & TESTED
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner min-h-[160px] space-y-2">
                    {sprint4Endpoints.map((ep, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ep.method.includes('GET') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="font-bold text-white shrink-0">{ep.path}</span>
                        <span className="text-slate-500 text-[11px] truncate">— {ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action / Command */}
        <div className="bg-indigo-600 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-indigo-600/15 border border-indigo-500 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center text-white shrink-0">
              <Terminal className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider block">Sprint 7 Automated Test Suite</span>
              <code className="text-white font-mono text-sm md:text-base font-bold mt-0.5 block">
                python3 backend/run_tests.py
              </code>
            </div>
          </div>
          <button
            onClick={handleCopyCommand}
            className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Command
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <footer className="pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest gap-2 border-t border-slate-800/60">
          <div className="flex items-center gap-3 flex-wrap">
            <span>FastAPI 0.110</span>
            <span className="opacity-30">•</span>
            <span>Vulnerability Management</span>
            <span className="opacity-30">•</span>
            <span>Notification Center</span>
            <span className="opacity-30">•</span>
            <span>Business Dashboards</span>
          </div>
          <div>Sprint 7 Complete : Vulnerability Management & Notification Center</div>
        </footer>
      </div>
    </div>
  );
};
