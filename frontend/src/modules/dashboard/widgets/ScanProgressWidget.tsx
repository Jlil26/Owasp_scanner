import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const ScanProgressWidget: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchScannerStats();
  }, []);

  const fetchScannerStats = async () => {
    try {
      const res = await fetch('/api/v1/analytics/scanner-stats');
      const json = await res.json();
      if (json.success && json.data?.tools) {
        setStats(json.data.tools);
      }
    } catch (e) {
      console.error('Failed to fetch scanner stats', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Scanner Engines & Tool Performance
          </span>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/60 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Docker Active
        </span>
      </div>

      {loading ? (
        <div className="p-4 text-center text-xs font-mono text-slate-500">Loading tool telemetry...</div>
      ) : (
        <div className="space-y-3 pt-1">
          {stats.map((tool, idx) => (
            <div key={idx} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs">
                  {tool.tool_name.substring(0, 3)}
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block">{tool.tool_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Avg runtime: {tool.avg_duration_seconds}s • Success: {tool.success_rate}%
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-cyan-400 block">{tool.findings_count} findings</span>
                <span className="text-[10px] text-slate-500">{tool.total_runs} total runs</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
