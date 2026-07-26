import React from 'react';
import { useAuthStore } from './store/authStore';
import { LandingPage } from './views/public/LandingPage';
import { LoginPage } from './views/auth/LoginPage';
import { RegisterCompanyPage } from './views/auth/RegisterCompanyPage';
import { ForgotPasswordPage } from './views/auth/ForgotPasswordPage';
import { OnboardingPage } from './views/auth/OnboardingPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AuditorLayout } from './layouts/AuditorLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { Database, RotateCcw } from 'lucide-react';

export function App() {
  const auth = useAuthStore();

  // If user clicks reset or is on unauthenticated route
  if (!auth.isAuthenticated) {
    if (auth.currentRoute === 'login') {
      return (
        <LoginPage
          onLogin={auth.login}
          onNavigateRegisterCompany={() => auth.navigate('register_company')}
          onNavigateForgotPassword={() => auth.navigate('forgot_password')}
          onNavigateLanding={() => auth.navigate('landing')}
          onLoadDemo={(role) => auth.loadDemoEnvironment(role)}
        />
      );
    }

    if (auth.currentRoute === 'register_company') {
      return (
        <RegisterCompanyPage
          onRegister={auth.registerCompany}
          onNavigateLogin={() => auth.navigate('login')}
          onNavigateLanding={() => auth.navigate('landing')}
        />
      );
    }

    if (auth.currentRoute === 'forgot_password') {
      return (
        <ForgotPasswordPage
          onNavigateLogin={() => auth.navigate('login')}
          onNavigateLanding={() => auth.navigate('landing')}
        />
      );
    }

    // Default unauthenticated view is Public Landing Page
    return (
      <LandingPage
        onNavigateLogin={() => auth.navigate('login')}
        onNavigateRegisterCompany={() => auth.navigate('register_company')}
        onLoadDemo={(role) => auth.loadDemoEnvironment(role)}
      />
    );
  }

  // If authenticated but needs onboarding (First time Super Admin creation)
  if (auth.currentRoute === 'onboarding' || (!auth.isOnboarded && auth.user?.role === 'SUPER_ADMIN')) {
    return (
      <OnboardingPage
        company={auth.company}
        user={auth.user}
        onComplete={auth.completeOnboarding}
      />
    );
  }

  // Authenticated workspace rendering based strictly on user.role
  const user = auth.user;
  const company = auth.company || { id: 'pme-01', name: 'CyberShield PME', slug: 'cybershield-pme', created_at: new Date().toISOString() };

  if (!user) {
    return (
      <LandingPage
        onNavigateLogin={() => auth.navigate('login')}
        onNavigateRegisterCompany={() => auth.navigate('register_company')}
        onLoadDemo={(role) => auth.loadDemoEnvironment(role)}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Role Workspace Rendering */}
      {user.role === 'SUPER_ADMIN' && (
        <AdminLayout
          user={user}
          company={company}
          onLogout={auth.logout}
          onSwitchRole={auth.switchRole}
          onResetData={auth.resetAllData}
        />
      )}

      {user.role === 'AUDITOR' && (
        <AuditorLayout
          user={user}
          company={company}
          onLogout={auth.logout}
          onSwitchRole={auth.switchRole}
        />
      )}

      {user.role === 'EMPLOYEE' && (
        <EmployeeLayout
          user={user}
          company={company}
          onLogout={auth.logout}
          onSwitchRole={auth.switchRole}
        />
      )}

      {/* Floating System State Bar */}
      <div className="fixed bottom-3 right-3 z-50 bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-3 shadow-2xl backdrop-blur-md flex items-center space-x-3 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>Base PME: <strong className="text-white">{company.name}</strong></span>
        </div>
        <span className="text-slate-700">|</span>
        <button
          onClick={auth.resetAllData}
          className="text-rose-400 hover:text-rose-300 hover:underline flex items-center space-x-1 cursor-pointer font-bold"
          title="Effacer la session et revenir à 0 entreprise"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Réinitialiser (0 Data)</span>
        </button>
      </div>
    </div>
  );
}

export default App;
