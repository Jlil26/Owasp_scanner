import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, TrendingDown, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SecurityScoreWidgetProps {
  score?: number;
  grade?: string;
  trendDelta?: number;
}

export const SecurityScoreWidget: React.FC<SecurityScoreWidgetProps> = ({
  score: propScore,
  grade: propGrade,
  trendDelta: propTrendDelta
}) => {
  const [data, setData] = useState<any>(null);
  const [showPenalties, setShowPenalties] = useState(false);

  useEffect(() => {
    if (propScore === undefined) {
      fetchScore();
    }
  }, [propScore]);

  const fetchScore = async () => {
    try {
      const res = await fetch('/api/v1/analytics/security-score');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load security score', e);
    }
  };

  const score = propScore ?? data?.score ?? 82;
  const grade = propGrade ?? data?.grade ?? (score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'F');
  const delta = propTrendDelta ?? data?.trend_delta ?? 4.2;

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (val >= 70) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    if (val >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Global Security Score</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getScoreColor(score)}`}>
          GRADE {grade}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div className="flex items-baseline space-x-3">
          <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{score}</span>
          <span className="text-slate-500 text-sm font-mono">/ 100</span>
        </div>

        <div className={`flex items-center space-x-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-md border ${
          delta >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        }`}>
          {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{delta >= 0 ? `+${delta}%` : `${delta}%`}</span>
        </div>
      </div>

      {/* Progress Gauge Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            score >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
            score >= 70 ? 'bg-gradient-to-r from-indigo-500 to-sky-400' :
            score >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
            'bg-gradient-to-r from-rose-600 to-red-400'
          }`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {/* Accordion toggle for Penalty Factor Breakdown */}
      <button
        onClick={() => setShowPenalties(!showPenalties)}
        className="mt-3 w-full flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors pt-2 border-t border-slate-800/60"
      >
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Score factors & SLA impact</span>
        </span>
        {showPenalties ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showPenalties && (
        <div className="mt-2.5 space-y-1.5 text-[11px] font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-slate-400">
          <div className="flex justify-between">
            <span>Critical Findings (-25pt ea):</span>
            <span className="text-slate-200 font-bold">{data?.penalty_breakdown?.critical ?? 0} pt</span>
          </div>
          <div className="flex justify-between">
            <span>High Severity (-15pt ea):</span>
            <span className="text-slate-200 font-bold">{data?.penalty_breakdown?.high ?? 15} pt</span>
          </div>
          <div className="flex justify-between">
            <span>Medium Severity (-4pt ea):</span>
            <span className="text-slate-200 font-bold">{data?.penalty_breakdown?.medium ?? 4} pt</span>
          </div>
          <div className="flex justify-between">
            <span>SLA Overdue Breaches (-10pt ea):</span>
            <span className="text-slate-200 font-bold">{data?.penalty_breakdown?.overdue_slas ?? 0} pt</span>
          </div>
        </div>
      )}

      {/* Decorative Glow */}
      <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none"></div>
    </div>
  );
};
