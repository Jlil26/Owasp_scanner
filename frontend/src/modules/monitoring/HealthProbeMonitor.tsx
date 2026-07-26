import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Database, HardDrive, Cpu, Server, ShieldCheck } from 'lucide-react';

interface DetailedHealth {
  status: string;
  uptime_seconds: number;
  environment: string;
  database: {
    status: string;
    driver: string;
    active_connections: number;
    max_connections: number;
  };
  cache: {
    status: string;
    provider: string;
    hit_rate_percent: number;
  };
  scanner_workers: {
    status: string;
    active_workers: number;
    tools: string[];
  };
  system_resources: {
    cpu_usage_percent: number;
    memory_usage_percent: number;
    disk_free_gb: number;
    disk_total_gb: number;
  };
  timestamp: string;
}

export const HealthProbeMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<DetailedHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [livenessStatus, setLivenessStatus] = useState<string>('healthy');
  const [readinessStatus, setReadinessStatus] = useState<string>('healthy');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [detRes, liveRes, readyRes] = await Promise.all([
        fetch('/api/v1/health/detailed'),
        fetch('/api/v1/health/liveness'),
        fetch('/api/v1/health/readiness')
      ]);

      if (detRes.ok) {
        const data = await detRes.json();
        setHealthData(data);
      }
      if (liveRes.ok) {
        const live = await liveRes.json();
        setLivenessStatus(live.status);
      }
      if (readyRes.ok) {
        const ready = await readyRes.json();
        setReadinessStatus(ready.status);
      }
    } catch (err) {
      console.error('Failed to fetch system health probes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Advanced System Health & Probes Status
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Liveness & Readiness container probes and component diagnostic status.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Probes Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Liveness Probe */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Liveness Probe</span>
            <p className="text-sm font-bold text-white mt-0.5">Process Status</p>
            <span className="text-[11px] text-slate-400 mt-1 block">HTTP GET /health/liveness</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
            livenessStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {livenessStatus.toUpperCase()}
          </span>
        </div>

        {/* Readiness Probe */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Readiness Probe</span>
            <p className="text-sm font-bold text-white mt-0.5">Services Ready</p>
            <span className="text-[11px] text-slate-400 mt-1 block">HTTP GET /health/readiness</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
            readinessStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {readinessStatus.toUpperCase()}
          </span>
        </div>

        {/* System Uptime */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Service Uptime</span>
            <p className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
              {healthData ? formatUptime(healthData.uptime_seconds) : 'Loading...'}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Env: {healthData?.environment || 'dev'}</span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Component Details Breakdown */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* PostgreSQL */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" />
                PostgreSQL DB
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                {healthData.database.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Connections: {healthData.database.active_connections} / {healthData.database.max_connections}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">Driver: {healthData.database.driver}</p>
          </div>

          {/* Redis */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Redis Cache
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                {healthData.cache.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Hit Rate: {healthData.cache.hit_rate_percent}%
            </p>
            <p className="text-[10px] text-slate-500 font-mono">Provider: {healthData.cache.provider}</p>
          </div>

          {/* Scanner Workers */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                Scan Engine
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                {healthData.scanner_workers.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Workers: {healthData.scanner_workers.active_workers} Active
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Tools: {healthData.scanner_workers.tools.join(', ')}
            </p>
          </div>

          {/* Storage Volume */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                Disk Storage
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded">
                OK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Free: {healthData.system_resources.disk_free_gb} GB / {healthData.system_resources.disk_total_gb} GB
            </p>
            <p className="text-[10px] text-slate-500 font-mono">Reports & Logs Volume</p>
          </div>
        </div>
      )}
    </div>
  );
};
