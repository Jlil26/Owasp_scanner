import React, { useState } from 'react';
import {
  Building2,
  Users,
  Globe,
  ShieldAlert,
  FileText,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  AlertOctagon,
  Sliders,
  Bell,
  Target,
  Layers,
  Activity,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Key
} from 'lucide-react';
import { User as UserType, Company, UserRole } from '../types/auth';
import { BusinessDashboardModule } from '../modules/dashboard/BusinessDashboardModule';
import { QAAuditModule } from '../modules/qa/QAAuditModule';
import { MonitoringPlatformModule } from '../modules/monitoring/MonitoringPlatformModule';
import { VulnerabilityModule } from '../modules/vulnerabilities/VulnerabilityModule';
import { ReportModule } from '../modules/reports/ReportModule';
import { NotificationModule } from '../modules/notifications/NotificationModule';

interface AdminLayoutProps {
  user: UserType;
  company: Company;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onResetData: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  company,
  onLogout,
  onSwitchRole,
  onResetData
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'company' | 'users' | 'roles' | 'assets' | 'targets' | 'scans' | 'vulnerabilities' | 'reports' | 'stats' | 'notifications' | 'audit_logs' | 'settings' | 'qa_cert'
  >('dashboard');

  const [teamList, setTeamList] = useState([
    { id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email, role: 'SUPER_ADMIN', status: 'Actif' },
    { id: 'usr-aud-01', name: 'Sophie Martin', email: 'auditor@pme.com', role: 'AUDITOR', status: 'Actif' },
    { id: 'usr-emp-01', name: 'Thomas Bernard', email: 'employee@pme.com', role: 'EMPLOYEE', status: 'Actif' }
  ]);

  const [targetsList, setTargetsList] = useState([
    { id: 'tgt-01', name: 'Application E-Commerce PME', url: 'https://shop.company-pme.fr', type: 'Web App', status: 'Vérifié' },
    { id: 'tgt-02', name: 'API Gateway Backend', url: 'https://api.company-pme.fr', type: 'REST API', status: 'Vérifié' }
  ]);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'AUDITOR' | 'EMPLOYEE'>('AUDITOR');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');

  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail && newUserFirstName) {
      setTeamList([
        ...teamList,
        {
          id: `usr-${Date.now()}`,
          name: `${newUserFirstName} ${newUserLastName || ''}`,
          email: newUserEmail,
          role: newUserRole,
          status: 'Actif'
        }
      ]);
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
    }
  };

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTargetName && newTargetUrl) {
      setTargetsList([
        ...targetsList,
        {
          id: `tgt-${Date.now()}`,
          name: newTargetName,
          url: newTargetUrl,
          type: 'Web App',
          status: 'Vérifié'
        }
      ]);
      setNewTargetName('');
      setNewTargetUrl('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#18181B] font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation for Super Admin (280px width) */}
      <aside className="w-full md:w-[280px] bg-white border-r border-[#ECECF2] p-5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand Logo with Security Gradient */}
          <div className="flex items-center space-x-3 px-1 py-1">
            <div className="w-10 h-10 rounded-2xl security-gradient flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#18181B]">
                OWASP<span className="security-gradient-text">_SCAN_PRO</span>
              </span>
              <span className="block text-[10px] text-[#71717A] font-medium uppercase tracking-wider">
                Super Admin Center
              </span>
            </div>
          </div>

          {/* Company Badge */}
          <div className="p-3.5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6D28D9] font-bold uppercase tracking-wider">PME / Tenant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs font-bold text-[#18181B] truncate">{company?.name || 'CyberShield PME'}</p>
            <span className="text-[10px] text-[#71717A] block font-mono">ID: {company?.id || 'pme-01'}</span>
          </div>

          {/* Super Admin Navigation Items (13 items according to UI spec) */}
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
              <span>Dashboard & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('company')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'company'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Entreprise</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Utilisateurs ({teamList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Rôles & Permissions</span>
            </button>

            <button
              onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'assets'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Actifs</span>
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
              <span>Cibles Autorisées ({targetsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('scans')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'scans'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Supervision des Scans</span>
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
              <span>Vulnérabilités</span>
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
              <span>Rapports Scellés</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Journaux d'Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#6D28D9] text-white font-bold shadow-md shadow-purple-600/25'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Paramètres & SLA</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-[#ECECF2] space-y-3">
          <div className="flex items-center space-x-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] border border-[#C4B5FD] text-[#6D28D9] font-bold text-xs flex items-center justify-center">
              SA
            </div>
            <div className="truncate text-xs">
              <span className="font-bold text-[#18181B] block truncate">{user.first_name} {user.last_name}</span>
              <span className="text-[10px] text-[#6D28D9] font-semibold uppercase">Super Admin</span>
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
        {/* Topbar (64px) with SecAD-08 Constraint Indicator & Role Switcher */}
        <header className="h-16 bg-white border-b border-[#ECECF2] px-6 flex items-center justify-between shadow-xs">
          <div>
            <h1 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#6D28D9]" />
              Super Administration PME
            </h1>
          </div>

          {/* SecAD-08 Constraint Badge + Demo Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[11px] font-mono font-bold rounded-xl flex items-center space-x-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Règle SecAD-08 : Lancement Scan Interdit en Admin</span>
            </div>

            <div className="flex items-center space-x-1 bg-[#F4F4F5] p-1 rounded-xl text-xs">
              <span className="text-[#71717A] px-2 text-[11px] font-medium">Changer rôle :</span>
              <button
                onClick={() => onSwitchRole('SUPER_ADMIN')}
                className="px-2.5 py-1 bg-[#6D28D9] text-white rounded-lg font-bold"
              >
                Admin
              </button>
              <button
                onClick={() => onSwitchRole('AUDITOR')}
                className="px-2.5 py-1 text-[#71717A] hover:text-[#18181B] rounded-lg"
              >
                Auditeur
              </button>
              <button
                onClick={() => onSwitchRole('EMPLOYEE')}
                className="px-2.5 py-1 text-[#71717A] hover:text-[#18181B] rounded-lg"
              >
                Employé
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace Views */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl">
          {activeTab === 'dashboard' && <BusinessDashboardModule />}

          {activeTab === 'company' && (
            <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#6D28D9]" />
                <span>Informations de l'Entreprise (Tenant)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#FAFAFC] rounded-xl border border-[#ECECF2]">
                  <span className="text-[10px] text-[#71717A] font-bold uppercase block">Raison Sociale</span>
                  <p className="text-sm font-bold text-[#18181B] mt-1">{company.name}</p>
                </div>
                <div className="p-4 bg-[#FAFAFC] rounded-xl border border-[#ECECF2]">
                  <span className="text-[10px] text-[#71717A] font-bold uppercase block">Identifiant Unique (Tenant ID)</span>
                  <p className="text-sm font-mono text-[#6D28D9] mt-1">{company.id}</p>
                </div>
                <div className="p-4 bg-[#FAFAFC] rounded-xl border border-[#ECECF2]">
                  <span className="text-[10px] text-[#71717A] font-bold uppercase block">Téléphone Support</span>
                  <p className="text-sm font-medium text-[#18181B] mt-1">{company.phone || '+33 1 42 68 55 00'}</p>
                </div>
                <div className="p-4 bg-[#FAFAFC] rounded-xl border border-[#ECECF2]">
                  <span className="text-[10px] text-[#71717A] font-bold uppercase block">Pays & Juridiction</span>
                  <p className="text-sm font-medium text-[#18181B] mt-1">{company.country || 'France'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[#6D28D9]" />
                  <span>Ajouter un collaborateur à la PME</span>
                </h3>

                <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Prénom *"
                    value={newUserFirstName}
                    onChange={e => setNewUserFirstName(e.target.value)}
                    className="px-4 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] focus:border-[#6D28D9]"
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newUserLastName}
                    onChange={e => setNewUserLastName(e.target.value)}
                    className="px-4 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] focus:border-[#6D28D9]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="email@pme.com *"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="px-4 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] focus:border-[#6D28D9]"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as any)}
                      className="px-3 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] font-mono text-xs"
                    >
                      <option value="AUDITOR">AUDITOR</option>
                      <option value="EMPLOYEE">EMPLOYEE</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2.5 btn-primary text-xs font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      Créer Membre
                    </button>
                  </div>
                </form>
              </div>

              {/* Members Table */}
              <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#18181B]">Liste des utilisateurs de la PME</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFC] text-[#71717A] font-semibold uppercase text-[10px] border-b border-[#ECECF2]">
                      <tr>
                        <th className="p-3">Nom</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Rôle RBAC</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECECF2]">
                      {teamList.map((m, i) => (
                        <tr key={i} className="hover:bg-[#FAFAFC]">
                          <td className="p-3 font-bold text-[#18181B]">{m.name}</td>
                          <td className="p-3 font-mono text-[#71717A]">{m.email}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] ${
                              m.role === 'SUPER_ADMIN' ? 'bg-[#EDE9FE] text-[#6D28D9]' :
                              m.role === 'AUDITOR' ? 'bg-[#EFF6FF] text-[#2563EB]' :
                              'bg-[#DCFCE7] text-[#166534]'
                            }`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="p-3 text-emerald-600 font-bold">{m.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                <Key className="w-5 h-5 text-[#6D28D9]" />
                <span>Grille des Rôles & Permissions RBAC</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl space-y-2">
                  <span className="text-xs font-bold text-[#6D28D9] uppercase block font-mono">1. SUPER_ADMIN</span>
                  <p className="text-[#71717A]">Administration de la PME, gestion des membres, création des cibles et politique SLA.</p>
                  <span className="text-[10px] text-[#DC2626] font-bold block">⛔ Interdiction absolue de lancer un scan (SecAD-08)</span>
                </div>
                <div className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl space-y-2">
                  <span className="text-xs font-bold text-[#2563EB] uppercase block font-mono">2. AUDITOR</span>
                  <p className="text-[#71717A]">Lancement et suivi des scans (ZAP, Nmap, Nikto), validation des rapports et signature SHA-256.</p>
                </div>
                <div className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl space-y-2">
                  <span className="text-xs font-bold text-[#166534] uppercase block font-mono">3. EMPLOYEE</span>
                  <p className="text-[#71717A]">Correction des vulnérabilités assignées, consultation des preuves HTTP, suivi des SLAs.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-[#6D28D9]" />
                  <span>Déclarer un Nouvel Actif (Asset)</span>
                </h3>
                <form onSubmit={handleAddTarget} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Nom de l'actif *"
                    value={newTargetName}
                    onChange={e => setNewTargetName(e.target.value)}
                    className="px-4 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B]"
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://domaine-pme.fr *"
                    value={newTargetUrl}
                    onChange={e => setNewTargetUrl(e.target.value)}
                    className="px-4 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 btn-primary text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Enregistrer Actif
                  </button>
                </form>
              </div>

              <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#18181B]">Inventaire des Actifs déclarés</h3>
                <div className="space-y-2">
                  {targetsList.map((t, idx) => (
                    <div key={idx} className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#18181B]">{t.name}</h4>
                        <span className="text-xs font-mono text-[#6D28D9]">{t.url}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[10px] font-bold rounded-lg">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#6D28D9]" />
                <span>Cibles attribuées aux Auditeurs</span>
              </h3>
              <p className="text-xs text-[#71717A]">
                Un auditeur ne peut lancer de scan que sur les cibles expressément attribuées par le Super Admin.
              </p>
              <div className="space-y-3 pt-2">
                {targetsList.map((t, idx) => (
                  <div key={idx} className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#18181B]">{t.name}</p>
                      <p className="text-xs font-mono text-[#6D28D9]">{t.url}</p>
                    </div>
                    <span className="px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold rounded-lg">
                      Attribué à: Sophie Martin (Auditeur)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scans' && (
            <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#6D28D9]" />
                <span>Supervision Générale des Scans PME</span>
              </h3>
              <p className="text-xs text-[#71717A]">
                Le Super Admin supervise l'état d'avancement des scans sans droit de déclenchement.
              </p>
              <div className="p-4 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#18181B]">Scan #8841 — Application E-Commerce PME</p>
                  <p className="text-[11px] text-[#71717A]">Lancé par: Sophie Martin (Auditeur) • Outils: ZAP, Nmap, Nikto</p>
                </div>
                <span className="px-3 py-1 bg-[#DCFCE7] text-[#166534] text-xs font-bold rounded-lg">
                  Terminé (100%)
                </span>
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && <VulnerabilityModule />}
          {activeTab === 'reports' && <ReportModule />}
          {activeTab === 'notifications' && <NotificationModule />}
          {activeTab === 'audit_logs' && <MonitoringPlatformModule />}

          {activeTab === 'settings' && (
            <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#6D28D9]" />
                <span>Politique de Remédiation SLA de la PME</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl space-y-1">
                  <span className="text-xs font-bold text-[#DC2626] font-mono uppercase block">SLA Critique</span>
                  <p className="text-2xl font-black text-[#991B1B]">7 Jours</p>
                  <p className="text-[11px] text-[#71717A]">RCE, SQL Injection, Broken Access Control</p>
                </div>

                <div className="p-4 bg-[#FFEDD5] border border-[#FDBA74] rounded-xl space-y-1">
                  <span className="text-xs font-bold text-[#EA580C] font-mono uppercase block">SLA Élevé</span>
                  <p className="text-2xl font-black text-[#9A3412]">14 Jours</p>
                  <p className="text-[11px] text-[#71717A]">XSS Stored, CSRF, Cryptographic Failures</p>
                </div>

                <div className="p-4 bg-[#FEF9C3] border border-[#FDE047] rounded-xl space-y-1">
                  <span className="text-xs font-bold text-[#EAB308] font-mono uppercase block">SLA Moyen</span>
                  <p className="text-2xl font-black text-[#854D0E]">30 Jours</p>
                  <p className="text-[11px] text-[#71717A]">Security Misconfiguration, Missing Headers</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
