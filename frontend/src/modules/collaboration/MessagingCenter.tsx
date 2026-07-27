import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Plus, User, AlertCircle, Shield, CheckCircle, AtSign, Paperclip, Hash, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  content: string;
  created_at: string;
}

interface Thread {
  id: string;
  vulnerability_id: string;
  subject?: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export const MessagingCenter: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showNewThreadModal, setShowNewThreadModal] = useState<boolean>(false);
  const [newSubject, setNewSubject] = useState<string>('');
  const [newInitialMsg, setNewInitialMsg] = useState<string>('');

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/v1/messaging/threads');
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
        if (data.length > 0 && !selectedThreadId) {
          setSelectedThreadId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch messaging threads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    try {
      const res = await fetch('/api/v1/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: selectedThread.id,
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchThreads();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const res = await fetch('/api/v1/messaging/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerability_id: 'v-001',
          subject: newSubject,
          initial_message: newInitialMsg
        })
      });

      if (res.ok) {
        const created = await res.json();
        setNewSubject('');
        setNewInitialMsg('');
        setShowNewThreadModal(false);
        fetchThreads();
        setSelectedThreadId(created.id);
      }
    } catch (err) {
      console.error('Failed to create thread', err);
    }
  };

  const insertMention = (username: string) => {
    setNewMessage(prev => `${prev} @${username} `);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-3 min-h-[600px]">
      {/* Threads Sidebar */}
      <div className="border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Fils de Discussion</h3>
          </div>
          <button
            onClick={() => setShowNewThreadModal(true)}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg transition font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau Fil
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Chargement des discussions...
          </div>
        ) : threads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            Aucun fil de discussion actif. Cliquez sur 'Nouveau Fil' pour collaborer.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {threads.map(thread => {
              const isSelected = thread.id === selectedThreadId;
              const lastMsg = thread.messages?.[thread.messages.length - 1];
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-indigo-300 truncate">
                      {thread.subject || 'Discussion Vulnérabilité'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {lastMsg ? `${lastMsg.sender_name} : ${lastMsg.content}` : 'Aucun message'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      Vuln #{thread.vulnerability_id.slice(0, 6)}
                    </span>
                    <span>{thread.messages?.length || 0} messages</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chat View */}
      <div className="lg:col-span-2 flex flex-col bg-slate-950">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  {selectedThread.subject}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lié à la vulnérabilité <span className="text-indigo-300 font-mono">#{selectedThread.vulnerability_id}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Fil d'Audit Interne
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px]">
              {selectedThread.messages && selectedThread.messages.length > 0 ? (
                selectedThread.messages.map(msg => (
                  <div key={msg.id} className="flex gap-3 text-slate-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
                      {msg.sender_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{msg.sender_name || 'Utilisateur'}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-mono">
                            {msg.sender_role || 'EMPLOYEE'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                  <Sparkles className="w-6 h-6 mb-2 text-indigo-400 opacity-60" />
                  Aucun message dans ce fil. Lancez la conversation ci-dessous.
                </div>
              )}
            </div>

            {/* Mention Helpers & Quick Bar */}
            <div className="px-4 py-1.5 bg-slate-900/60 border-t border-slate-800/60 flex items-center gap-2 text-xs overflow-x-auto">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <AtSign className="w-3 h-3 text-indigo-400" /> Mention rapide :
              </span>
              <button
                type="button"
                onClick={() => insertMention('Auditeur Sécurité')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700 transition"
              >
                @Auditeur Sécurité
              </button>
              <button
                type="button"
                onClick={() => insertMention('Dev Lead')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700 transition"
              >
                @Dev Lead
              </button>
              <button
                type="button"
                onClick={() => insertMention('Super Admin')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700 transition"
              >
                @Super Admin
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Écrivez un message ou mentionnez un collègue (@nom)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            Sélectionnez un fil à gauche ou créez une nouvelle discussion.
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Créer un Fil de Collaboration
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Démarrez un fil de discussion interne concernant une vulnérabilité ou une constatation de sécurité.
            </p>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sujet du Fil</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="ex: Validation du correctif pour l'Injection SQL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Message Initial</label>
                <textarea
                  rows={3}
                  value={newInitialMsg}
                  onChange={e => setNewInitialMsg(e.target.value)}
                  placeholder="Décrivez le sujet de discussion ou mentionnez vos collaborateurs (@nom)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  Créer le Fil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
