import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  MessageSquare,
  Bell,
  LogOut,
  Code,
  FileCode,
  CheckSquare,
  BarChart3,
  User,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { User as UserType, Company, UserRole } from '../types/auth';
import { VulnerabilityModule } from '../modules/vulnerabilities/VulnerabilityModule';
import { CollaborationCenterModule } from '../modules/collaboration/CollaborationCenterModule';
import { NotificationModule } from '../modules/notifications/NotificationModule';
import { BrandLogo } from '../components/BrandLogo';

interface EmployeeLayoutProps {
  user: UserType;
  company: Company;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({
  user,
  company,
  onLogout,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'vulnerabilities' | 'fixes' | 'chat' | 'history' | 'notifications'
  >('vulnerabilities');

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#18181B] font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation for Employee (280px width) */}
      <aside className="w-full md:w-[280px] bg-white border-r border-[#ECECF2] p-5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="px-1 py-1">
            <BrandLogo size="md" subtitle="Espace Développeur & Remédiation" />
          </div>

          {/* Developer Team Badge */}
          <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-2xl space-y-1">
            <span className="text-[10px] text-[#166534] font-bold uppercase tracking-wider">Équipe Développeur</span>
            <p className="text-xs font-bold text-[#18181B] truncate">{company?.name || 'CyberShield PME'}</p>
            <span className="text-[10px] text-[#166534] block font-mono">Objectif: 100% Remédiation SLA</span>
          </div>

          {/* Employee Navigation Items */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#16A34A] text-white font-bold shadow-md shadow-emerald-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard Remédiation</span>
            </button>

            <button
              onClick={() => setActiveTab('vulnerabilities')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'vulnerabilities'
                  ? 'bg-[#16A34A] text-white font-bold shadow-md shadow-emerald-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Mes Vulnérabilités & Code Fix</span>
            </button>

            <button
              onClick={() => setActiveTab('fixes')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'fixes'
                  ? 'bg-[#16A34A] text-white font-bold shadow-md shadow-emerald-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mes Correctifs & SLA</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#16A34A] text-white font-bold shadow-md shadow-emerald-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discussions (Chat Auditeur)</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#16A34A] text-white font-bold shadow-md shadow-emerald-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-[#ECECF2] space-y-3">
          <div className="flex items-center space-x-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] font-bold text-xs flex items-center justify-center">
              DEV
            </div>
            <div className="truncate text-xs">
              <span className="font-bold text-[#18181B] block truncate">{user.first_name} {user.last_name}</span>
              <span className="text-[10px] text-[#166534] font-semibold uppercase">Employé Développeur</span>
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
              <UserCheck className="w-5 h-5 text-[#16A34A]" />
              Espace Développeur & Remédiation
            </h1>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-[#F4F4F5] p-1 rounded-xl text-xs">
              <span className="text-[#71717A] px-2 text-[11px] font-medium">Changer rôle :</span>
              <button onClick={() => onSwitchRole('SUPER_ADMIN')} className="px-2.5 py-1 text-[#71717A] hover:text-[#18181B] rounded-lg">Admin</button>
              <button onClick={() => onSwitchRole('AUDITOR')} className="px-2.5 py-1 text-[#71717A] hover:text-[#18181B] rounded-lg">Auditeur</button>
              <button onClick={() => onSwitchRole('EMPLOYEE')} className="px-2.5 py-1 bg-[#16A34A] text-white rounded-lg font-bold">Employé</button>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-[#ECECF2] rounded-2xl shadow-xs space-y-2">
                <span className="text-xs text-[#71717A] font-bold uppercase block">Mes Vulnérabilités</span>
                <p className="text-3xl font-black text-[#18181B]">2 Assignées</p>
                <span className="text-xs text-[#DC2626] font-bold">1 Faulle Critique dans le SLA</span>
              </div>
              <div className="p-6 bg-white border border-[#ECECF2] rounded-2xl shadow-xs space-y-2">
                <span className="text-xs text-[#71717A] font-bold uppercase block">Décompte SLA</span>
                <p className="text-3xl font-black text-[#EA580C]">5 Jours Restants</p>
                <span className="text-xs text-[#71717A]">Mise à jour en direct</span>
              </div>
              <div className="p-6 bg-white border border-[#ECECF2] rounded-2xl shadow-xs space-y-2">
                <span className="text-xs text-[#71717A] font-bold uppercase block">Taux de Résolution</span>
                <p className="text-3xl font-black text-[#16A34A]">85% Complété</p>
                <span className="text-xs text-[#16A34A] font-bold">Vérifié par l'Auditeur</span>
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && <VulnerabilityModule />}
          {activeTab === 'fixes' && <VulnerabilityModule />}
          {activeTab === 'chat' && <CollaborationCenterModule />}
          {activeTab === 'notifications' && <NotificationModule />}
        </div>
      </main>
    </div>
  );
};
