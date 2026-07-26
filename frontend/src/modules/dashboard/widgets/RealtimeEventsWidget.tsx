import React from 'react';
import { Activity, Radio, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRealtimeFeed } from '../../../hooks/useRealtimeFeed';

export const RealtimeEventsWidget: React.FC = () => {
  const { data, loading, isLive, setIsLive, lastUpdated, refresh } = useRealtimeFeed(5000);

  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-bold font-mono">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold font-mono">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold font-mono">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded font-bold font-mono">INFO</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block">
              Realtime Security Feed
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Last poll: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <Radio className={`w-3 h-3 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isLive ? 'LIVE TICKER ON' : 'PAUSED'}</span>
          </button>

          <button
            onClick={refresh}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-md border border-slate-800 transition-colors cursor-pointer"
            title="Force refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Counter summary bar */}
      <div className="grid grid-cols-3 gap-2 font-mono text-center">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">ACTIVE SCANS</span>
          <span className="text-lg font-bold text-sky-400">{data?.active_scans_count ?? 1}</span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">CRITICAL OPEN</span>
          <span className="text-lg font-bold text-rose-400">{data?.open_critical_count ?? 0}</span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">PENDING VERIF</span>
          <span className="text-lg font-bold text-amber-400">{data?.pending_verifications_count ?? 1}</span>
        </div>
      </div>

      {/* Events feed list */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {loading && !data ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500">Connecting telemetry stream...</div>
        ) : data?.events?.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500 bg-slate-950 rounded-xl">No recent telemetry events</div>
        ) : (
          data?.events.map((evt) => (
            <div key={evt.id} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-start justify-between space-x-3 hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(evt.severity)}
                  <span className="text-xs font-bold text-white font-mono">{evt.title}</span>
                </div>
                <p className="text-[11px] text-slate-400">{evt.description}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0 pt-0.5">{evt.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
