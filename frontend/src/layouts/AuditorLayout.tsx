import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Clock,
  FileText,
  MessageSquare,
  Bell,
  LogOut,
  Terminal,
  Target,
  BarChart3,
  User,
  ShieldCheck,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { User as UserType, Company, UserRole } from '../types/auth';
import { ScannerModule } from '../modules/scanner/ScannerModule';
import { ReportModule } from '../modules/reports/ReportModule';
import { CollaborationCenterModule } from '../modules/collaboration/CollaborationCenterModule';
import { NotificationModule } from '../modules/notifications/NotificationModule';
import { VulnerabilityModule } from '../modules/vulnerabilities/VulnerabilityModule';
import { BrandLogo } from '../components/BrandLogo';

interface AuditorLayoutProps {
  user: UserType;
  company: Company;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const AuditorLayout: React.FC<AuditorLayoutProps> = ({
  user,
  company,
  onLogout,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'targets' | 'scanner' | 'scans' | 'reports' | 'vulnerabilities' | 'chat' | 'profile'
  >('scanner');

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#18181B] font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation for Auditor (280px width) */}
      <aside className="w-full md:w-[280px] bg-white border-r border-[#ECECF2] p-5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="px-1 py-1">
            <BrandLogo size="md" subtitle="Espace Auditeur Sécurité" />
          </div>

          {/* HUGE NOUVEAU SCAN BUTTON */}
          <button
            onClick={() => setActiveTab('scanner')}
            className="w-full py-3.5 px-4 btn-primary text-sm font-black rounded-xl shadow-lg flex items-center justify-center space-x-2.5 cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-5 h-5" />
            <span>NOUVEAU SCAN</span>
          </button>

          {/* Assigned Company Badge */}
          <div className="p-3.5 bg-[#EFF6FF] border border-[#93C5FD] rounded-2xl space-y-1">
            <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider">Cible Entreprise</span>
            <p className="text-xs font-bold text-[#18181B] truncate">{company?.name || 'CyberShield PME'}</p>
            <span className="text-[10px] text-[#71717A] block font-mono">https://app.company-pme.fr</span>
          </div>

          {/* Auditor Navigation Items */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('targets')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'targets'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Mes Cibles</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Scanner (Assistant Wizard)</span>
            </button>

            <button
              onClick={() => setActiveTab('scans')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'scans'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Historique des Scans</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Rapports & Signature SHA-256</span>
            </button>

            <button
              onClick={() => setActiveTab('vulnerabilities')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'vulnerabilities'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Vulnérabilités Identifiées</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat avec les Développeurs</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-[#ECECF2] space-y-3">
          <div className="flex items-center space-x-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#93C5FD] text-[#2563EB] font-bold text-xs flex items-center justify-center">
              AU
            </div>
            <div className="truncate text-xs">
              <span className="font-bold text-[#18181B] block truncate">{user.first_name} {user.last_name}</span>
              <span className="text-[10px] text-[#2563EB] font-semibold uppercase">Auditeur Sécurité</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#FAFAFC]">
        {/* Topbar (64px) */}
        <header className="h-16 bg-white border-b border-[#ECECF2] px-6 flex items-center justify-between shadow-xs">
          <div>
            <h1 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#2563EB]" />
              Espace Audit & Scans Sécurité
            </h1>
          </div>

          {/* Quick Launch Button + Role Switcher */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-4 py-2 btn-primary text-xs font-extrabold rounded-xl shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Lancer un Scan</span>
            </button>

            <div className="flex items-center space-x-1 bg-[#F4F4F5] p-1 rounded-xl text-xs">
              <span className="text-[#71717A] px-2 text-[11px] font-medium">Changer rôle :</span>
              <button onClick={() => onSwitchRole('SUPER_ADMIN')} className="px-2.5 py-1 text-[#71717A] hover:text-[#18181B] rounded-lg">Admin</button>
              <button onClick={() => onSwitchRole('AUDITOR')} className="px-2.5 py-1 bg-[#2563EB] text-white rounded-lg font-bold">Auditeur</button>
              <button onClick={() => onSwitchRole('EMPLOYEE')} className="px-2.5 py-1 text-[#71717A] hover:text-[#18181B] rounded-lg">Employé</button>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-[#ECECF2] rounded-2xl shadow-xs space-y-2">
                <span className="text-xs text-[#71717A] font-bold uppercase block">Aujourd'hui</span>
                <p className="text-3xl font-black text-[#18181B]">3 Scans exécutés</p>
                <span className="text-xs text-emerald-600 font-bold">100% de réussite conteneurs</span>
              </div>
              <div className="p-6 bg-white border border-[#ECECF2] rounded-2xl shadow-xs space-y-2">
                <span className="text-xs text-[#71717A] font-bold uppercase block">Cibles Attribuées</span>
                <p className="text-3xl font-black text-[#6D28D9]">2 Applications</p>
                <span className="text-xs text-[#2563EB] font-bold">Périmètre vérifié par Super Admin</span>
              </div>
              <div className="p-6 bg-white border border-[#ECECF2] rounded-2xl shadow-xs space-y-2">
                <span className="text-xs text-[#71717A] font-bold uppercase block">Rapports Générés</span>
                <p className="text-3xl font-black text-[#18181B]">12 PDF Signés</p>
                <span className="text-xs text-[#6D28D9] font-mono font-bold">SHA-256 Valide</span>
              </div>
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#2563EB]" />
                <span>Mes Cibles Autorisées au Scan</span>
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#18181B]">Application E-Commerce PME</h4>
                    <span className="text-xs font-mono text-[#6D28D9]">https://shop.company-pme.fr</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="px-3.5 py-1.5 btn-primary text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Scanner cette cible
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scanner' && <ScannerModule />}
          {activeTab === 'scans' && <ScannerModule />}
          {activeTab === 'reports' && <ReportModule />}
          {activeTab === 'vulnerabilities' && <VulnerabilityModule />}
          {activeTab === 'chat' && <CollaborationCenterModule />}
        </div>
      </main>
    </div>
  );
};
