import React from 'react';
import { PieChart, ShieldAlert } from 'lucide-react';

interface SeverityDistributionProps {
  distribution?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export const SeverityDistributionWidget: React.FC<SeverityDistributionProps> = ({
  distribution = { critical: 0, high: 1, medium: 1, low: 1, info: 0 }
}) => {
  const total = distribution.critical + distribution.high + distribution.medium + distribution.low + distribution.info;

  const items = [
    { label: 'CRITICAL', count: distribution.critical, color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/40' },
    { label: 'HIGH', count: distribution.high, color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-950/40' },
    { label: 'MEDIUM', count: distribution.medium, color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/40' },
    { label: 'LOW', count: distribution.low, color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/40' },
    { label: 'INFO', count: distribution.info, color: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-900/40' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <PieChart className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Severity Risk Distribution</span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
          {total} Total Findings
        </span>
      </div>

      {/* Visual Percentage Bar */}
      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800 p-0.5 space-x-0.5">
        {total === 0 ? (
          <div className="w-full bg-slate-800/40 h-full rounded-full"></div>
        ) : (
          items.map((item, idx) => {
            const pct = (item.count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={idx}
                className={`${item.color} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${pct}%` }}
                title={`${item.label}: ${item.count} (${pct.toFixed(1)}%)`}
              ></div>
            );
          })
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {items.map((item, idx) => (
          <div key={idx} className={`${item.bg} border ${item.border} p-3 rounded-xl flex flex-col justify-between space-y-1`}>
            <span className={`text-[10px] font-mono font-bold tracking-wider block ${item.text}`}>{item.label}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-white font-mono">{item.count}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {total > 0 ? `${((item.count / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
