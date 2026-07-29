import React, { useState } from 'react';
import { Building2, Globe, Users, ShieldAlert, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Company, User } from '../../types/auth';

interface OnboardingPageProps {
  company: Company | null;
  user: User | null;
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  company,
  user,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetUrl, setTargetUrl] = useState('https://app.victime-pme.fr');
  const [targetName, setTargetName] = useState('Application Web Principale');
  const [auditorEmail, setAuditorEmail] = useState('auditeur@pme.com');
  const [employeeEmail, setEmployeeEmail] = useState('devlead@pme.com');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3 z-10">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Première Connexion — Configuration Onboarding</span>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">
          Bienvenue, {user?.first_name || 'Super Admin'} !
        </h2>
        <p className="text-xs text-slate-300">
          Initialisation de l'espace de travail sécurisé pour <strong className="text-purple-400">{company?.name || 'Votre PME'}</strong>.
        </p>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-center space-x-3 pt-4">
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${step === 1 ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            <span>1. Périmètre Cible</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${step === 2 ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            <span>2. Invitation Équipe</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${step === 3 ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            <span>3. Politique SLA</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Étape 1 : Enregistrer votre première cible à scanner</h3>
                  <p className="text-slate-400">Définissez l'adresse URL du domaine ou de l'application web de votre PME.</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nom du Périmètre Target</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={e => setTargetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Adresse URL de la Cible (FQDN)</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 cursor-pointer mt-4"
              >
                <span>Continuer vers l'Étape 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Étape 2 : Gestion future de vos collaborateurs</h3>
                  <p className="text-slate-400">Pour le moment, seul votre compte Administrateur PME est actif.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-purple-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Création différée des accès par le Super Admin</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Après validation de l'inscription, vous accéderez au Dashboard. Depuis le menu <strong className="text-white">Utilisateurs</strong>, vous pourrez ajouter vos propres comptes <strong>Auditeur Sécurité</strong> et <strong>Développeur / Employé</strong> en leur définissant leurs identifiants et mots de passe.
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Continuer vers l'Étape 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Étape 3 : Valider la Politique SLA de Remédiation</h3>
                  <p className="text-slate-400">Délais légaux de résolution des vulnérabilités appliqués à l'entreprise.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 font-mono uppercase block">Critique</span>
                  <span className="text-lg font-black text-white">7 jours</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 font-mono uppercase block">Élevée</span>
                  <span className="text-lg font-black text-white">14 jours</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-sky-400 font-mono uppercase block">Moyenne</span>
                  <span className="text-lg font-black text-white">30 jours</span>
                </div>
              </div>

              <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-slate-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Tout est prêt ! Vous allez être redirigé vers le Dashboard Super Admin.</span>
              </div>

              <button
                onClick={onComplete}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 text-white font-bold rounded-xl shadow-xl shadow-purple-600/30 transition flex items-center justify-center space-x-2 cursor-pointer mt-4"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accéder à l'Espace Super Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
