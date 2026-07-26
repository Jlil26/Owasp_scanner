import React, { useState, useEffect } from 'react';
import { Terminal, AlertTriangle, Bug, Filter, RefreshCw, Clock, ShieldAlert } from 'lucide-react';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: string;
  path: string;
  method: string;
  status_code: number;
  message: string;
  exception_type?: string;
  tenant_id?: string;
  user_id?: string;
}

export const SystemErrorLogTracker: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const fetchErrorLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/system/errors?limit=30');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch system error logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const filtered = filterLevel === 'ALL'
    ? logs
    : logs.filter(l => l.level === filterLevel);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-400" />
            Structured Logging & Error Tracking
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured JSON request logs, correlation IDs, and application runtime exceptions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
            {['ALL', 'ERROR', 'WARNING'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                  filterLevel === lvl ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={fetchErrorLogs}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Log Stream */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Loading structured logs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
            No application error logs detected in this filter window.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    item.level === 'ERROR'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {item.level}
                  </span>
                  <span className="text-xs font-mono text-indigo-300 font-semibold">
                    {item.method} {item.path}
                  </span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    Status {item.status_code}
                  </span>
                </div>

                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-200 font-mono bg-slate-900/60 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                {item.message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                <span>Exception: {item.exception_type || 'HTTPException'}</span>
                <span>Tenant: {item.tenant_id || 'system'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
