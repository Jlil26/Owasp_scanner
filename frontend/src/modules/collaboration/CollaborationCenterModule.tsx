import React, { useState } from 'react';
import { MessageSquare, Paperclip, Activity, FileText, Shield, Sparkles, Users, AtSign, CheckCircle2 } from 'lucide-react';
import { MessagingCenter } from './MessagingCenter';
import { VulnerabilityDiscussionPanel } from './VulnerabilityDiscussionPanel';
import { ReportCommentsPanel } from './ReportCommentsPanel';
import { ActivityJournal } from './ActivityJournal';
import { AttachmentManager } from './AttachmentManager';

export const CollaborationCenterModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'messaging' | 'vulnerabilities' | 'reports' | 'activity' | 'attachments'>('messaging');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <MessageSquare className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Module Collaboration
              </span>
              <span className="text-xs text-slate-400">Hub de Communication Interne</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Espace Collaboration & Messagerie Sécurisée
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Fils de discussion internes, commentaires de remédiation, mentions (@utilisateur), preuves d'audit jointes, retours sur rapports et journal d'activité unifié.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Statut Sécurité Interne</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Messagerie Directe Active
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-500/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('messaging')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'messaging'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Messagerie Interne
          </button>

          <button
            onClick={() => setActiveTab('vulnerabilities')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'vulnerabilities'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            Discussions Vulnérabilités
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Retours sur Rapports
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Journal d'Activité
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'attachments'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            Pièces Jointes & Preuves
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'messaging' && <MessagingCenter />}
      {activeTab === 'vulnerabilities' && (
        <VulnerabilityDiscussionPanel
          vulnerabilityId="v-001"
          vulnerabilityTitle="Injection SQL dans le paramètre de recherche (A03:2021-Injection)"
        />
      )}
      {activeTab === 'reports' && (
        <ReportCommentsPanel
          reportId="rep-001"
          reportTitle="Rapport d'Audit Sécurité OWASP_SCAN_PRO v1.0"
        />
      )}
      {activeTab === 'activity' && <ActivityJournal />}
      {activeTab === 'attachments' && <AttachmentManager />}
    </div>
  );
};
