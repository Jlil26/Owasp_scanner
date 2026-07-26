import React, { useState, useEffect } from 'react';
import { Activity, MessageSquare, Paperclip, AtSign, Filter, Clock, User, Shield, CheckCircle2 } from 'lucide-react';

interface CollaborationActivity {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  summary: string;
  details?: string;
  created_at: string;
}

export const ActivityJournal: React.FC = () => {
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/v1/activity');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch collaboration activity feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = filterType === 'ALL'
    ? activities
    : activities.filter(a => a.action.includes(filterType) || a.resource_type === filterType.toLowerCase());

  const getActionBadge = (action: string) => {
    if (action.includes('THREAD')) {
      return { label: 'Thread', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: MessageSquare };
    }
    if (action.includes('ATTACHMENT')) {
      return { label: 'Attachment', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Paperclip };
    }
    if (action.includes('COMMENT')) {
      return { label: 'Comment', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: MessageSquare };
    }
    if (action.includes('MENTION')) {
      return { label: 'Mention', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AtSign };
    }
    return { label: 'Activity', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Activity };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Collaboration Journal & Audit Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable activity stream of discussions, proof uploads, comments, and mentions.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
          {['ALL', 'THREAD', 'COMMENT', 'ATTACHMENT'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                filterType === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Stream */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading activity stream...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No collaboration activities logged yet.
          </div>
        ) : (
          filtered.map(act => {
            const badge = getActionBadge(act.action);
            const Icon = badge.icon;
            return (
              <div
                key={act.id}
                className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-start gap-3 hover:border-slate-700 transition"
              >
                <div className={`p-2 rounded-lg border ${badge.bg} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{act.user_name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {act.user_role}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium">{act.summary}</p>
                  {act.details && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 bg-slate-900/60 p-2 rounded border border-slate-800/60 font-mono">
                      {act.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
