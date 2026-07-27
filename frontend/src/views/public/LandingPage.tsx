import React from 'react';
import { ArrowRight, Building2, Lock, ShieldAlert, UserCheck, CheckCircle2, FileText, Terminal, Database, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegisterCompany: () => void;
  onLoadDemo: (role?: 'SUPER_ADMIN' | 'AUDITOR' | 'EMPLOYEE') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateRegisterCompany,
  onLoadDemo
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Public Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <BrandLogo size="md" subtitle="SaaS PME v1.0" />

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateLogin}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
          >
            Se connecter
          </button>
          <button
            onClick={onNavigateRegisterCompany}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center space-x-1.5"
          >
            <span>Créer une entreprise</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight pt-4">
          La sécurité continue simplifiée pour votre entreprise
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Orchestration automatisée des scanners OWASP ZAP, Nmap et Nikto en conteneurs éphémères. Rapports inviolables avec signature SHA-256 et espaces de travail RBAC hermétiques.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onNavigateRegisterCompany}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-purple-600/30 transition flex items-center justify-center space-x-2.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Créer un espace PME (Gratuit 14 jours)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateLogin}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Accéder à mon espace</span>
          </button>
        </div>

        {/* Instant Evaluation Quick Links */}
        <div className="pt-6 border-t border-slate-800/80 max-w-3xl mx-auto">
          <p className="text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">
            Mode Évaluation Rapide — Tester un espace de travail :
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onLoadDemo('SUPER_ADMIN')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/40 text-purple-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Super Admin PME</span>
            </button>

            <button
              onClick={() => onLoadDemo('AUDITOR')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Auditeur Scanner</span>
            </button>

            <button
              onClick={() => onLoadDemo('EMPLOYEE')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Employé Développeur</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto bg-slate-900/40 border-y border-slate-800/60 rounded-3xl">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">Architecture SaaS Professionnelle</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">4 Piliers Fondamentaux de OWASP_SCAN_PRO</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 hover:border-purple-500/40 transition shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Isolation Multi-Tenant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Base PostgreSQL isolée par <code className="text-purple-300">tenant_id</code>. Aucune fuite de données entre entreprises.
            </p>
          </div>

          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 hover:border-indigo-500/40 transition shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Scanners Éphémères</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exécution OWASP ZAP, Nmap et Nikto dans des conteneurs Docker éphémères nettoyés après chaque analyse.
            </p>
          </div>

          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 hover:border-violet-500/40 transition shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Non-Répudiation SHA-256</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chaque rapport PDF généré est scellé par un hash cryptographique SHA-256 garanti conforme audits NIS2.
            </p>
          </div>

          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 hover:border-emerald-500/40 transition shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">RBAC par Authentification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Super Admin, Auditeur et Employé possèdent des espaces de travail et menus totalement distincts.
            </p>
          </div>
        </div>
      </section>

      {/* RBAC Workspaces Presentation Section */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Espaces de Travail Hermétiques</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">RBAC Strict dès l'Authentification</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Pas de simple masquage de boutons : chaque rôle accède exclusivement aux fonctionnalités autorisées par sa fonction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Super Admin Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold font-mono rounded-lg uppercase">
                Rôle 01
              </span>
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Espace Super Admin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Créé uniquement lors de l'enregistrement de la PME. Pilote les utilisateurs, les assets, la politique SLA et les logs de sécurité.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-rose-400 font-mono text-[11px]">
                <span>⛔ Règle SecAD-08 : Aucun bouton Scanner</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gestion d'équipe & Rôles</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Journal d'audit non-répudiable</span>
              </div>
            </div>
          </div>

          {/* Auditor Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold font-mono rounded-lg uppercase">
                Rôle 02
              </span>
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Espace Auditeur</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Espace dédié au spécialiste cybersécurité. Lance les scans ZAP/Nmap/Nikto, valide les cibles et génère les rapports signés.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Moteur de scan multi-outils</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Validation des rapports PDF & SHA-256</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                <span>🔒 Aucune gestion d'utilisateurs</span>
              </div>
            </div>
          </div>

          {/* Employee Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold font-mono rounded-lg uppercase">
                Rôle 03
              </span>
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Espace Employé / Dev</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interface épurée axée sur la remédiation rapide. L'employé voit ses vulnérabilités assignées, les preuves HTTP et le compte à rebours SLA.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Queue de tâches & Preuves HTTP</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Suivi SLA & Chat avec l'auditeur</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                <span>🔒 Aucun accès au scanner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-8 bg-slate-950 text-center text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white font-mono">OWASP_SCAN_PRO v1.0.0</span>
          <span>— Plateforme SaaS de Gestion Continue des Vulnérabilités</span>
        </div>
        <p>Certifié 100% conforme PRD, SAD, DDD, SecAD, D13, D16 & D17 • Sprint 13 Product Release</p>
      </footer>
    </div>
  );
};
