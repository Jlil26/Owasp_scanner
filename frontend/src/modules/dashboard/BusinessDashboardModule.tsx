import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  Briefcase,
  Play,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { SecurityScoreWidget } from './widgets/SecurityScoreWidget';
import { SeverityDistributionWidget } from './widgets/SeverityDistributionWidget';
import { OwaspCategoryWidget } from './widgets/OwaspCategoryWidget';
import { RemediationTrendWidget } from './widgets/RemediationTrendWidget';
import { RealtimeEventsWidget } from './widgets/RealtimeEventsWidget';
import { ScanProgressWidget } from './widgets/ScanProgressWidget';
import { TopRisksWidget } from './widgets/TopRisksWidget';

export const BusinessDashboardModule: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'auditor' | 'employee'>('admin');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData(role);
  }, [role]);

  const fetchDashboardData = async (selectedRole: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/dashboards/${selectedRole}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Role Switcher Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-100 tracking-tight">Security Analytics & Intelligence Center</h3>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold rounded-md uppercase">
                Sprint 8
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-tailored security supervision dashboards, OWASP analytics, and real-time telemetry
            </p>
          </div>
        </div>

        {/* Role Select Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => setRole('admin')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              role === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
          <button
            onClick={() => setRole('auditor')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              role === 'auditor'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Auditor</span>
          </button>
          <button
            onClick={() => setRole('employee')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              role === 'employee'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employee</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="p-16 text-center text-slate-400 text-xs font-mono bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Compiling role-specific security metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards Grid per Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {role === 'admin' && (
              <>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Tenants & Platform</span>
                  <div className="text-3xl font-black text-slate-100">{data.total_tenants} Tenant</div>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Multi-Tenant Isolation
                  </span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Active Users</span>
                  <div className="text-3xl font-black text-slate-100">{data.total_users}</div>
                  <span className="text-[11px] text-slate-400 font-mono">Auditors & Employees</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Active Remediations</span>
                  <div className="text-3xl font-black text-amber-400">{data.active_remediations}</div>
                  <span className="text-[11px] text-amber-400/90 font-mono">Assigned / In Progress</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">SLA Remediation Rate</span>
                  <div className="text-3xl font-black text-emerald-400">{data.remediation_rate}%</div>
                  <span className="text-[11px] text-emerald-400/90 font-mono">Resolved vs Open</span>
                </div>
              </>
            )}

            {role === 'auditor' && (
              <>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Assigned Target Scope</span>
                  <div className="text-3xl font-black text-slate-100">{data.assigned_targets} Cibles</div>
                  <span className="text-[11px] text-slate-400 font-mono">Scannable Assets</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Total Scans Executed</span>
                  <div className="text-3xl font-black text-slate-100">{data.total_scans_executed}</div>
                  <span className="text-[11px] text-sky-400 font-mono">OWASP ZAP / Nmap / Nikto</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Vulnerabilities Discovered</span>
                  <div className="text-3xl font-black text-rose-400">{data.vulnerabilities_discovered}</div>
                  <span className="text-[11px] text-rose-400/90 font-mono">Consolidated Findings</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Pending Verification</span>
                  <div className="text-3xl font-black text-cyan-400">{data.pending_verifications}</div>
                  <span className="text-[11px] text-cyan-400/90 font-mono">Awaiting Auditor Sign-off</span>
                </div>
              </>
            )}

            {role === 'employee' && (
              <>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">My Assigned Flaws</span>
                  <div className="text-3xl font-black text-slate-100">{data.assigned_vulnerabilities}</div>
                  <span className="text-[11px] text-slate-400 font-mono">Developer Tickets</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Fixes In Progress</span>
                  <div className="text-3xl font-black text-amber-400">{data.in_progress_count}</div>
                  <span className="text-[11px] text-amber-400/90 font-mono">Active Code Patching</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">Resolved & Verified</span>
                  <div className="text-3xl font-black text-emerald-400">{data.resolved_count}</div>
                  <span className="text-[11px] text-emerald-400/90 font-mono">Fixed & Validated</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <span className="text-slate-400 text-xs font-mono">SLA Overdue Tickets</span>
                  <div className="text-3xl font-black text-rose-400">{data.overdue_count}</div>
                  <span className="text-[11px] text-rose-400/90 font-mono">Breached SLA Limit</span>
                </div>
              </>
            )}
          </div>

          {/* Prominent Action Banner for Auditor */}
          {role === 'auditor' && (
            <div className="bg-gradient-to-r from-indigo-900/80 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest block">
                  Operational Scanner Trigger
                </span>
                <h4 className="text-lg font-bold text-white">Execute Security Audit Scan</h4>
                <p className="text-xs text-slate-300">
                  Launch OWASP ZAP, Nmap, and Nikto against assigned web targets and generate AI findings
                </p>
              </div>
              <button
                onClick={() => alert('Navigate to Scanner Orchestrator tab to trigger scan.')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4 text-white fill-white" />
                <span>NOUVEAU SCAN</span>
              </button>
            </div>
          )}

          {/* Core Analytics Grid Section 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <SecurityScoreWidget
                score={data.security_score}
                grade={data.security_grade}
              />
            </div>
            <div className="lg:col-span-8">
              <SeverityDistributionWidget distribution={data.severity_distribution} />
            </div>
          </div>

          {/* Core Analytics Grid Section 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <OwaspCategoryWidget />
            </div>
            <div className="lg:col-span-6">
              <RemediationTrendWidget />
            </div>
          </div>

          {/* Core Analytics Grid Section 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <TopRisksWidget />
            </div>
            <div className="lg:col-span-6">
              <RealtimeEventsWidget />
            </div>
          </div>

          {/* Scanner Engines Stats */}
          {role !== 'employee' && (
            <div>
              <ScanProgressWidget />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
