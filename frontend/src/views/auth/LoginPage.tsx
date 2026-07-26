import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Building2, UserCheck, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  onNavigateRegisterCompany: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateLanding: () => void;
  onLoadDemo: (role?: 'SUPER_ADMIN' | 'AUDITOR' | 'EMPLOYEE') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onNavigateRegisterCompany,
  onNavigateForgotPassword,
  onNavigateLanding,
  onLoadDemo
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez saisir votre adresse e-mail et votre mot de passe.');
      return;
    }

    setLoading(true);
    const result = await onLogin(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onNavigateLanding}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 transition cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>← Retour à l'accueil</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 shadow-xl shadow-purple-900/40 border border-purple-500/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Connexion à OWASP_SCAN_PRO</h2>
        <p className="text-xs text-slate-400">
          Accédez à votre espace de travail sécurisé selon votre rôle attribué.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Adresse e-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@mon-entreprise.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">Mot de passe</label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-[11px] text-purple-400 hover:underline font-medium cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Verification...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Direct Demo Connection Buttons */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <p className="text-[11px] font-mono text-slate-400 text-center uppercase tracking-wider">
              Accès démo immédiat par rôle :
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onLoadDemo('SUPER_ADMIN')}
                className="py-2 px-2 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 rounded-xl text-[11px] font-medium text-purple-300 transition flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => onLoadDemo('AUDITOR')}
                className="py-2 px-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[11px] font-medium text-indigo-300 transition flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auditeur</span>
              </button>

              <button
                type="button"
                onClick={() => onLoadDemo('EMPLOYEE')}
                className="py-2 px-2 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-[11px] font-medium text-emerald-300 transition flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Employé</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Vous n'avez pas encore d'entreprise enregistrée ? </span>
            <button
              onClick={onNavigateRegisterCompany}
              className="text-purple-400 font-bold hover:underline cursor-pointer block mt-1 mx-auto"
            >
              Créer une PME (Seul moyen de créer un Super Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
