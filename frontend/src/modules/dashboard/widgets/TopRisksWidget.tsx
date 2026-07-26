import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export const TopRisksWidget: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTopRisks();
  }, []);

  const fetchTopRisks = async () => {
    try {
      const res = await fetch('/api/v1/vulnerabilities?size=5');
      const json = await res.json();
      if (json.success && json.data?.items) {
        setItems(json.data.items);
      }
    } catch (e) {
      console.error('Failed to load top risks', e);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Top High Risk Vulnerabilities
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
          Action Required
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500">Loading risk items...</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500 bg-slate-950 rounded-xl">
          No open vulnerabilities pending remediation!
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                  <span className="text-xs font-bold text-white font-mono truncate max-w-[260px]">{item.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-3">
                  <span>CWE: {item.cwe || 'N/A'}</span>
                  <span>•</span>
                  <span>SLA: {item.remediation_sla_days || 14} days</span>
                  <span>•</span>
                  <span className="text-cyan-400">{item.assigned_employee_name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] rounded-md font-bold">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
