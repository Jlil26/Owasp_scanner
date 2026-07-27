import React, { useState, useEffect } from 'react';
import { FileText, Send, MessageSquare, AtSign, Shield, CheckCircle, Clock } from 'lucide-react';

interface ReportComment {
  id: string;
  report_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

interface ReportCommentsPanelProps {
  reportId: string;
  reportTitle?: string;
}

export const ReportCommentsPanel: React.FC<ReportCommentsPanelProps> = ({
  reportId,
  reportTitle = 'OWASP_SCAN_PRO Audit Report'
}) => {
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/v1/reports/${reportId}/comments`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setComments(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch report comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/v1/reports/${reportId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to post report comment', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Revue de Rapport & Retours d'Audit</h3>
            <p className="text-xs text-slate-400">{reportTitle} (ID : {reportId})</p>
          </div>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Rapport Vérifié SHA-256
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Chargement des retours...</div>
        ) : comments.length > 0 ? (
          comments.map(c => (
            <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-300">{c.author_name}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-mono">
                    {c.author_role}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(c.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <p className="text-xs text-slate-300">{c.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            Aucun retour d'audit sur ce rapport pour le moment.
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handlePostComment} className="pt-2 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Ajouter une observation ou mentionner l'auditeur (@nom)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Send className="w-3.5 h-3.5" />
          Envoyer la remarque
        </button>
      </form>
    </div>
  );
};
