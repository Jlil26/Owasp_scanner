import React, { useState, useEffect } from 'react';
import { Cpu, Server, Terminal, RefreshCw, CheckCircle2, Play, Square, AlertCircle } from 'lucide-react';

interface WorkerInfo {
  worker_id: string;
  tool_name: string;
  status: string;
  container_id: string;
  current_target?: string;
  cpu_percent: number;
  memory_used_mb: number;
  uptime_seconds: number;
}

export const WorkersManagementPanel: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/system/workers');
      if (res.ok) {
        const json = await res.json();
        setWorkers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch workers status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'IDLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Ephemeral Docker Scan Workers Monitor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Isolated Docker containers executing OWASP ZAP, Nmap, and Nikto security tools.
          </p>
        </div>

        <button
          onClick={fetchWorkers}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Workers
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {workers.map(w => (
          <div
            key={w.worker_id}
            className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {w.tool_name} Worker
                </h4>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getStatusBadge(w.status)}`}>
                {w.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
              <p className="flex justify-between text-slate-400">
                <span>Container ID:</span>
                <span className="text-indigo-300">{w.container_id}</span>
              </p>
              <p className="flex justify-between text-slate-400">
                <span>Target:</span>
                <span className="text-white truncate max-w-[140px]">{w.current_target || 'None (Standby)'}</span>
              </p>
              <p className="flex justify-between text-slate-400">
                <span>CPU Usage:</span>
                <span className="text-emerald-400">{w.cpu_percent}%</span>
              </p>
              <p className="flex justify-between text-slate-400">
                <span>Memory:</span>
                <span className="text-purple-300">{w.memory_used_mb} MB</span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>Ephemeral Worker Isolation</span>
              <span className="text-indigo-400 font-medium">Docker Network: scanner</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
