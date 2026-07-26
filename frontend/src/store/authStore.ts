import { useState, useEffect } from 'react';
import { User, Company, AuthState, RegisterCompanyPayload, UserRole } from '../types/auth';

const STORAGE_KEY = 'owasp_scan_pro_auth_v1.0';

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isAuthenticated: parsed.isAuthenticated || false,
          token: parsed.token || null,
          user: parsed.user || null,
          company: parsed.company || null,
          currentRoute: parsed.currentRoute || 'landing',
          activeWorkspaceTab: parsed.activeWorkspaceTab || 'dashboard',
          isOnboarded: parsed.isOnboarded ?? false
        };
      }
    } catch (e) {
      console.error('Failed to parse saved auth state', e);
    }
    return {
      isAuthenticated: false,
      token: null,
      user: null,
      company: null,
      currentRoute: 'landing',
      activeWorkspaceTab: 'dashboard',
      isOnboarded: false
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  }, [state]);

  const navigate = (route: AuthState['currentRoute'], tab?: string) => {
    setState(prev => ({
      ...prev,
      currentRoute: route,
      ...(tab ? { activeWorkspaceTab: tab } : {})
    }));
  };

  const registerCompany = async (payload: RegisterCompanyPayload) => {
    try {
      const res = await fetch('/api/v1/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setState({
          isAuthenticated: true,
          token: data.data.access_token,
          user: data.data.user,
          company: data.data.company,
          currentRoute: 'onboarding',
          activeWorkspaceTab: 'dashboard',
          isOnboarded: false
        });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Échec de l\'inscription' };
      }
    } catch (err: any) {
      // Offline / fallback register creation
      const companyId = `pme-${Date.now().toString(36)}`;
      const userId = `usr-${Date.now().toString(36)}`;
      const names = payload.admin_name.split(' ');
      
      const newCompany: Company = {
        id: companyId,
        name: payload.company_name,
        slug: payload.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        phone: payload.phone || '',
        country: payload.country || 'France',
        plan: 'PME_STARTER',
        created_at: new Date().toISOString()
      };

      const newUser: User = {
        id: userId,
        company_id: companyId,
        email: payload.email,
        first_name: names[0] || payload.admin_name,
        last_name: names.slice(1).join(' ') || 'Admin',
        role: 'SUPER_ADMIN',
        is_active: true,
        created_at: new Date().toISOString()
      };

      setState({
        isAuthenticated: true,
        token: `jwt-offline-${userId}`,
        user: newUser,
        company: newCompany,
        currentRoute: 'onboarding',
        activeWorkspaceTab: 'dashboard',
        isOnboarded: false
      });
      return { success: true, message: 'Entreprise et Super Admin créés avec succès.' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setState({
          isAuthenticated: true,
          token: data.data.access_token,
          user: data.data.user,
          company: data.data.company,
          currentRoute: 'workspace',
          activeWorkspaceTab: 'dashboard',
          isOnboarded: true
        });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Identifiants invalides.' };
      }
    } catch (err: any) {
      // Fallback
      return { success: false, message: 'Erreur réseau lors de la connexion.' };
    }
  };

  const logout = () => {
    setState({
      isAuthenticated: false,
      token: null,
      user: null,
      company: null,
      currentRoute: 'landing',
      activeWorkspaceTab: 'dashboard',
      isOnboarded: false
    });
  };

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      isOnboarded: true,
      currentRoute: 'workspace'
    }));
  };

  const switchRole = (role: UserRole) => {
    if (!state.user) return;
    const roleNames = {
      SUPER_ADMIN: { first: 'Super', last: 'Admin' },
      AUDITOR: { first: 'Lead', last: 'Auditor' },
      EMPLOYEE: { first: 'Dev Lead', last: 'Employee' }
    };

    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        role,
        first_name: roleNames[role].first,
        last_name: roleNames[role].last
      } : null,
      activeWorkspaceTab: 'dashboard'
    }));
  };

  const loadDemoEnvironment = (role: UserRole = 'SUPER_ADMIN') => {
    const demoCompany: Company = {
      id: 'pme-demo-01',
      name: 'CyberShield PME Tech',
      slug: 'cybershield-pme',
      phone: '+33 1 42 68 55 00',
      country: 'France',
      plan: 'PME_ENTERPRISE',
      created_at: new Date().toISOString()
    };

    const roleNames = {
      SUPER_ADMIN: { first: 'Jean-Marc', last: 'SuperAdmin', email: 'admin@pme.com' },
      AUDITOR: { first: 'Sophie', last: 'SecurityAuditor', email: 'auditor@pme.com' },
      EMPLOYEE: { first: 'Thomas', last: 'DevLeadEmployee', email: 'employee@pme.com' }
    };

    const demoUser: User = {
      id: `usr-${role.toLowerCase()}-01`,
      company_id: demoCompany.id,
      email: roleNames[role].email,
      first_name: roleNames[role].first,
      last_name: roleNames[role].last,
      role: role,
      is_active: true,
      created_at: new Date().toISOString()
    };

    setState({
      isAuthenticated: true,
      token: `jwt-demo-${role}`,
      user: demoUser,
      company: demoCompany,
      currentRoute: 'workspace',
      activeWorkspaceTab: 'dashboard',
      isOnboarded: true
    });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      isAuthenticated: false,
      token: null,
      user: null,
      company: null,
      currentRoute: 'landing',
      activeWorkspaceTab: 'dashboard',
      isOnboarded: false
    });
  };

  return {
    ...state,
    navigate,
    registerCompany,
    login,
    logout,
    completeOnboarding,
    switchRole,
    loadDemoEnvironment,
    resetAllData
  };
}
