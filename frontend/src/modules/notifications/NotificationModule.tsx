import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertCircle, ShieldAlert, Info, MessageSquare } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationModule: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/notifications');
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/read-all', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'VULNERABILITY_ASSIGNED':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'SCAN_COMPLETED':
        return <CheckCheck className="w-4 h-4 text-emerald-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4 text-slate-100">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Notification & Alert Center</h3>
            <p className="text-xs text-slate-400">Internal system alerts, task assignments, and remediation SLA warnings</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading internal notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No internal notifications present.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-slate-950/40 opacity-75' : 'bg-slate-900/80 border-l-2 border-l-cyan-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 mb-0.5">{n.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-1">{n.message}</p>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800 text-cyan-300 text-[11px] font-medium rounded transition-colors whitespace-nowrap"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
