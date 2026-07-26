import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Database, Server, Terminal, Eye, Copy, Check, RefreshCw } from 'lucide-react';

interface SystemResources {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  uptime_seconds: number;
  active_db_connections: number;
}

export const SystemMetricsDashboard: React.FC = () => {
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [prometheusRaw, setPrometheusRaw] = useState<string>('');
  const [showPrometheusView, setShowPrometheusView] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const [resStatus, metricsRes] = await Promise.all([
        fetch('/api/v1/system/status'),
        fetch('/api/v1/metrics')
      ]);

      if (resStatus.ok) {
        const json = await resStatus.json();
        setResources(json.data);
      }
      if (metricsRes.ok) {
        const raw = await metricsRes.text();
        setPrometheusRaw(raw);
      }
    } catch (err) {
      console.error('Failed to fetch system metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleCopyPrometheus = () => {
    navigator.clipboard.writeText(prometheusRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Performance & Resource Metrics (Prometheus Export)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time server resource usage and Prometheus / Grafana metrics scraping endpoint.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowPrometheusView(!showPrometheusView)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              showPrometheusView
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            {showPrometheusView ? 'Show Metrics Cards' : 'View Raw Prometheus Scrape'}
          </button>

          <button
            onClick={fetchSystemData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!showPrometheusView ? (
        <div className="space-y-6">
          {/* Resource Usage Bar Cards */}
          {resources && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* CPU Usage */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-400" /> CPU Utilization
                  </span>
                  <span className="text-base font-bold text-indigo-300 font-mono">
                    {resources.cpu_percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${resources.cpu_percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">8 vCPU Ubuntu Server Host</p>
              </div>

              {/* Memory Usage */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-400" /> RAM Memory
                  </span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {resources.memory_percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${resources.memory_percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {(resources.memory_used_mb / 1024).toFixed(1)} GB used of {(resources.memory_total_mb / 1024).toFixed(0)} GB RAM
                </p>
              </div>

              {/* Disk Usage */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-amber-400" /> Disk Volume
                  </span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    {resources.disk_percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${resources.disk_percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {resources.disk_used_gb} GB used of {resources.disk_total_gb} GB SSD
                </p>
              </div>
            </div>
          )}

          {/* Database Connections & Scraper Info */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">PostgreSQL Connection Pool Status</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Active Connections: <span className="text-indigo-300 font-mono font-bold">{resources?.active_db_connections || 4}</span> / 20 MAX
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs text-slate-300 font-mono">
              Prometheus Scrape Route: <span className="text-emerald-400">GET /api/v1/metrics</span>
            </div>
          </div>
        </div>
      ) : (
        /* Raw Prometheus Output View */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-300 font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Standard Prometheus OpenMetrics Scrape Output
            </span>
            <button
              onClick={handleCopyPrometheus}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Metrics'}
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
            {prometheusRaw}
          </pre>
        </div>
      )}
    </div>
  );
};
