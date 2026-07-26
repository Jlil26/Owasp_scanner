import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle } from 'lucide-react';

export const OwaspCategoryWidget: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBreakdown();
  }, []);

  const fetchBreakdown = async () => {
    try {
      const res = await fetch('/api/v1/analytics/owasp-breakdown');
      const json = await res.json();
      if (json.success && json.data?.categories) {
        setCategories(json.data.categories);
      }
    } catch (e) {
      console.error('Failed to load OWASP breakdown', e);
    } finally {
      setLoading(false);
    }
  };

  const activeCategories = categories.filter(c => c.count > 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            OWASP Top 10 Mapping
          </span>
        </div>
        <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-800/60">
          2021 Standard
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500">Loading OWASP analytics...</div>
      ) : activeCategories.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
          No vulnerabilities mapped to OWASP categories yet.
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {activeCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-200 truncate max-w-[280px]" title={cat.name}>
                  {cat.name}
                </span>
                <div className="flex items-center space-x-2 font-mono">
                  {cat.critical_count > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold">
                      {cat.critical_count} CRITICAL
                    </span>
                  )}
                  <span className="text-slate-300 font-bold">{cat.count} finding{cat.count > 1 ? 's' : ''}</span>
                  <span className="text-slate-500 text-[10px]">({cat.percentage}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(cat.percentage, 5)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
