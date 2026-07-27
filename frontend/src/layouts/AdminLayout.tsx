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
  Key,
  Edit3,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  X
} from 'lucide-react';
import { User as UserType, Company, UserRole } from '../types/auth';
import { BusinessDashboardModule } from '../modules/dashboard/BusinessDashboardModule';
import { QAAuditModule } from '../modules/qa/QAAuditModule';
import { MonitoringPlatformModule } from '../modules/monitoring/MonitoringPlatformModule';
import { VulnerabilityModule } from '../modules/vulnerabilities/VulnerabilityModule';
import { ReportModule } from '../modules/reports/ReportModule';
import { NotificationModule } from '../modules/notifications/NotificationModule';
import { BrandLogo } from '../components/BrandLogo';

interface AdminLayoutProps {
  user: UserType;
  company: Company;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onResetData: () => void;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'AUDITOR' | 'EMPLOYEE';
  status: 'Actif' | 'Inactif';
  password?: string;
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

  const [teamList, setTeamList] = useState<TeamMember[]>([
    { id: user.id, firstName: user.first_name, lastName: user.last_name, name: `${user.first_name} ${user.last_name}`, email: user.email, role: 'SUPER_ADMIN', status: 'Actif', password: '••••••••' },
    { id: 'usr-aud-01', firstName: 'Sophie', lastName: 'Martin', name: 'Sophie Martin', email: 'auditor@pme.com', role: 'AUDITOR', status: 'Actif', password: '••••••••' },
    { id: 'usr-emp-01', firstName: 'Thomas', lastName: 'Bernard', name: 'Thomas Bernard', email: 'employee@pme.com', role: 'EMPLOYEE', status: 'Actif', password: '••••••••' }
  ]);

  const [targetsList, setTargetsList] = useState([
    { id: 'tgt-01', name: 'Application E-Commerce PME', url: 'https://shop.company-pme.fr', type: 'Web App', status: 'Vérifié' },
    { id: 'tgt-02', name: 'API Gateway Backend', url: 'https://api.company-pme.fr', type: 'REST API', status: 'Vérifié' }
  ]);

  // New User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'SUPER_ADMIN' | 'AUDITOR' | 'EMPLOYEE'>('AUDITOR');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [userNotification, setUserNotification] = useState<string | null>(null);

  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail && newUserFirstName) {
      const passToSet = newUserPassword || generatePassword();
      const createdUser: TeamMember = {
        id: `usr-${Date.now()}`,
        firstName: newUserFirstName,
        lastName: newUserLastName || '',
        name: `${newUserFirstName} ${newUserLastName || ''}`.trim(),
        email: newUserEmail,
        role: newUserRole,
        status: 'Actif',
        password: passToSet
      };

      setTeamList([...teamList, createdUser]);
      setUserNotification(`Utilisateur ${createdUser.name} créé avec le mot de passe : ${passToSet}`);
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserPassword('');
      setTimeout(() => setUserNotification(null), 8000);
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setTeamList(teamList.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...editingUser,
          name: `${editingUser.firstName} ${editingUser.lastName || ''}`.trim(),
          password: editPassword ? editPassword : u.password
        };
      }
      return u;
    }));

    setUserNotification(`Compte et mot de passe mis à jour avec succès pour ${editingUser.firstName} ${editingUser.lastName}!`);
    setEditingUser(null);
    setEditPassword('');
    setTimeout(() => setUserNotification(null), 5000);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le compte de ${userName} ?`)) {
      setTeamList(teamList.filter(u => u.id !== userId));
      setUserNotification(`Compte de ${userName} supprimé.`);
      setTimeout(() => setUserNotification(null), 4000);
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
          {/* Brand Logo */}
          <div className="px-1 py-1">
            <BrandLogo size="md" subtitle="Super Admin Center" />
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

        {/* Global User Notification Banner */}
        {userNotification && (
          <div className="mx-6 mt-4 p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{userNotification}</span>
            </div>
            <button onClick={() => setUserNotification(null)} className="text-purple-400 hover:text-purple-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
              {/* Add User Form */}
              <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#18181B] flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[#6D28D9]" />
                  <span>Créer un compte collaborateur</span>
                </h3>

                <form onSubmit={handleAddUser} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#71717A] font-medium mb-1">Rôle RBAC</label>
                      <select
                        value={newUserRole}
                        onChange={e => setNewUserRole(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] font-mono text-xs"
                      >
                        <option value="AUDITOR">AUDITEUR SÉCURITÉ</option>
                        <option value="EMPLOYEE">DÉVELOPPEUR / EMPLOYÉ</option>
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#71717A] font-medium mb-1">Mot de passe initial</label>
                      <div className="relative flex items-center">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Laissez vide pour auto-générer"
                          value={newUserPassword}
                          onChange={e => setNewUserPassword(e.target.value)}
                          className="w-full pl-3 pr-16 py-2.5 bg-[#FAFAFC] border border-[#ECECF2] rounded-xl text-[#18181B] font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-9 text-[#71717A] hover:text-[#18181B] p-1 cursor-pointer"
                          title="Afficher/Masquer"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewUserPassword(generatePassword())}
                          className="absolute right-2 text-[#6D28D9] hover:text-[#5B21B6] p-1 cursor-pointer"
                          title="Générer un mot de passe fort"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-md shadow-purple-600/20"
                      >
                        + Créer le compte
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Members Table */}
              <div className="bg-white border border-[#ECECF2] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">Liste des comptes utilisateurs ({teamList.length})</h3>
                  <span className="text-xs text-[#71717A]">
                    Total: <strong className="text-[#18181B]">{teamList.length}</strong> membres
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFC] text-[#71717A] font-semibold uppercase text-[10px] border-b border-[#ECECF2]">
                      <tr>
                        <th className="p-3">Utilisateur</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Rôle RBAC</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Mot de Passe</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECECF2]">
                      {teamList.map((m) => (
                        <tr key={m.id} className="hover:bg-[#FAFAFC]">
                          <td className="p-3 font-bold text-[#18181B]">
                            {m.name}
                            {m.id === user.id && (
                              <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-mono uppercase">
                                Vous
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[#71717A]">{m.email}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] ${
                              m.role === 'SUPER_ADMIN' ? 'bg-[#EDE9FE] text-[#6D28D9]' :
                              m.role === 'AUDITOR' ? 'bg-[#EFF6FF] text-[#2563EB]' :
                              'bg-[#DCFCE7] text-[#166534]'
                            }`}>
                              {m.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : m.role === 'AUDITOR' ? 'AUDITEUR' : 'EMPLOYÉ'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              m.status === 'Actif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>{m.password ? 'Défini' : '••••••••'}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingUser({ ...m });
                                  setEditPassword('');
                                }}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#6D28D9] border border-purple-200 rounded-lg font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Modifier</span>
                              </button>

                              {m.id !== user.id && (
                                <button
                                  onClick={() => handleDeleteUser(m.id, m.name)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Supprimer</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit User Modal */}
              {editingUser && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-900 animate-in fade-in zoom-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Edit3 className="w-5 h-5 text-[#6D28D9]" />
                        <h3 className="font-bold text-base">Modifier le compte de {editingUser.name}</h3>
                      </div>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Prénom</label>
                          <input
                            type="text"
                            required
                            value={editingUser.firstName}
                            onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Nom</label>
                          <input
                            type="text"
                            value={editingUser.lastName}
                            onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Adresse e-mail</label>
                        <input
                          type="email"
                          required
                          value={editingUser.email}
                          onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Rôle RBAC</label>
                          <select
                            value={editingUser.role}
                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                          >
                            <option value="SUPER_ADMIN">SUPER ADMIN</option>
                            <option value="AUDITOR">AUDITEUR SÉCURITÉ</option>
                            <option value="EMPLOYEE">EMPLOYÉ / DÉVELOPPEUR</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Statut du compte</label>
                          <select
                            value={editingUser.status}
                            onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                          >
                            <option value="Actif">Actif</option>
                            <option value="Inactif">Inactif / Suspendu</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-purple-900 font-bold">
                            Changer / Réinitialiser le mot de passe
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditPassword(generatePassword())}
                            className="text-[11px] text-[#6D28D9] underline hover:text-purple-900 font-mono cursor-pointer"
                          >
                            Générer un mot de passe
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={showEditPassword ? 'text' : 'password'}
                            placeholder="Saisissez un nouveau mot de passe..."
                            value={editPassword}
                            onChange={e => setEditPassword(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-white border border-purple-200 rounded-lg text-slate-900 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-purple-700">
                          Laissez vide si vous ne souhaitez pas modifier le mot de passe actuel.
                        </p>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                        >
                          Enregistrer les modifications
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
