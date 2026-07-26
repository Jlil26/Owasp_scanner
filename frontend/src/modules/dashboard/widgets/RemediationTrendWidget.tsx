import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

export const RemediationTrendWidget: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const res = await fetch('/api/v1/analytics/trends?days=14');
      const json = await res.json();
      if (json.success && json.data?.trend) {
        setTrends(json.data.trend);
      }
    } catch (e) {
      console.error('Failed to load trends', e);
    } finally {
      setLoading(false);
    }
  };

  const maxScanCount = Math.max(...trends.map(t => Math.max(t.scans_count, t.discovered, t.resolved, 1)), 1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Scan & Remediation Activity Trends
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-400" /> Last 14 Days
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500">Loading trend analytics...</div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Legend */}
          <div className="flex items-center justify-end space-x-4 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
              <span className="text-slate-400">Scans Executed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span className="text-slate-400">Discovered</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-slate-400">Resolved</span>
            </div>
          </div>

          {/* Activity Bar Visualization */}
          <div className="grid grid-cols-7 gap-2 items-end h-32 pt-2 pb-1 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            {trends.slice(-7).map((pt, idx) => {
              const scanH = Math.min(100, (pt.scans_count / maxScanCount) * 100);
              const discH = Math.min(100, (pt.discovered / maxScanCount) * 100);
              const resH = Math.min(100, (pt.resolved / maxScanCount) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end space-y-1">
                  <div className="flex items-end space-x-1 w-full justify-center h-20">
                    <div
                      className="w-2 bg-sky-500 rounded-t-sm transition-all duration-500 hover:brightness-125"
                      style={{ height: `${Math.max(scanH, 10)}%` }}
                      title={`Scans: ${pt.scans_count}`}
                    ></div>
                    <div
                      className="w-2 bg-rose-500 rounded-t-sm transition-all duration-500 hover:brightness-125"
                      style={{ height: `${Math.max(discH, 8)}%` }}
                      title={`Discovered: ${pt.discovered}`}
                    ></div>
                    <div
                      className="w-2 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:brightness-125"
                      style={{ height: `${Math.max(resH, 8)}%` }}
                      title={`Resolved: ${pt.resolved}`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 truncate">{pt.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
