import { useState, useEffect } from 'react';
import { User, Company, AuthState, RegisterCompanyPayload, UserRole } from '../types/auth';

const STORAGE_KEY = 'owasp_scan_pro_auth_v1.0';

export const saveRegisteredUserLocal = (user: User, company: Company, password?: string) => {
  try {
    const existingStr = localStorage.getItem('owasp_scan_pro_registered_users');
    let list = existingStr ? JSON.parse(existingStr) : [];
    if (!Array.isArray(list)) list = [];
    list = list.filter((item: any) => item.email?.toLowerCase() !== user.email.toLowerCase());
    list.push({ email: user.email.toLowerCase(), user, company, password });
    localStorage.setItem('owasp_scan_pro_registered_users', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save user locally', e);
  }
};

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
      if (data.success && data.data) {
        saveRegisteredUserLocal(data.data.user, data.data.company);
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

      saveRegisteredUserLocal(newUser, newCompany);

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
    const cleanEmail = email.trim();

    // 1. Try API login with 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.data) {
          const userObj: User = {
            id: data.data.user.id,
            company_id: data.data.user.company_id,
            email: data.data.user.email,
            first_name: data.data.user.first_name || '',
            last_name: data.data.user.last_name || '',
            role: (data.data.user.role || 'SUPER_ADMIN') as UserRole,
            is_active: true,
            created_at: new Date().toISOString()
          };
          const companyObj: Company = {
            id: data.data.user.company_id,
            name: data.data.user.company_name || 'Ma PME Security',
            slug: (data.data.user.company_name || 'pme').toLowerCase().replace(/[^a-z0-9]/g, '-'),
            phone: '+33 1 42 68 55 00',
            country: 'France',
            plan: 'PME_STARTER',
            created_at: new Date().toISOString()
          };
          saveRegisteredUserLocal(userObj, companyObj, password);
          setState({
            isAuthenticated: true,
            token: data.data.access_token,
            user: userObj,
            company: companyObj,
            currentRoute: 'workspace',
            activeWorkspaceTab: 'dashboard',
            isOnboarded: true
          });
          return { success: true, message: data.message || 'Connexion réussie.' };
        }
      }
    } catch (err: any) {
      console.warn('Backend login endpoint unavailable or timed out, using local/fallback auth:', err);
    }

    // 2. Check local saved registered accounts
    try {
      const savedUsersStr = localStorage.getItem('owasp_scan_pro_registered_users');
      if (savedUsersStr) {
        const users = JSON.parse(savedUsersStr);
        const found = users.find((u: any) => u.email?.toLowerCase() === cleanEmail.toLowerCase());
        if (found && found.user) {
          setState({
            isAuthenticated: true,
            token: `jwt-local-${found.user.id}`,
            user: found.user,
            company: found.company,
            currentRoute: 'workspace',
            activeWorkspaceTab: 'dashboard',
            isOnboarded: true
          });
          return { success: true, message: 'Connexion réussie !' };
        }
      }
    } catch (e) {
      console.error('Error checking saved local users', e);
    }

    // 3. Fallback seamless login for any email/password provided by user
    if (cleanEmail && cleanEmail.includes('@') && password && password.length >= 1) {
      const usernamePart = cleanEmail.split('@')[0].toLowerCase();

      // Infer role intelligently from email address instead of forcing SUPER_ADMIN
      let inferredRole: UserRole = 'EMPLOYEE';
      if (usernamePart.includes('admin') || usernamePart.includes('super')) {
        inferredRole = 'SUPER_ADMIN';
      } else if (usernamePart.includes('audit')) {
        inferredRole = 'AUDITOR';
      } else {
        // If an existing registered company exists, attach to it as EMPLOYEE or AUDITOR
        inferredRole = 'EMPLOYEE';
      }

      // Reuse existing company if available
      let targetCompany: Company | null = null;
      try {
        const savedStr = localStorage.getItem('owasp_scan_pro_registered_users');
        if (savedStr) {
          const list = JSON.parse(savedStr);
          if (Array.isArray(list) && list.length > 0 && list[0].company) {
            targetCompany = list[0].company;
          }
        }
      } catch (e) {}

      if (!targetCompany) {
        targetCompany = {
          id: `pme-usr-${usernamePart}`,
          name: `${usernamePart.toUpperCase()} Security PME`,
          slug: usernamePart,
          phone: '+33 1 42 68 55 00',
          country: 'France',
          plan: 'PME_STARTER',
          created_at: new Date().toISOString()
        };
      }

      const fallbackUser: User = {
        id: `usr-${usernamePart}-${Date.now().toString(36)}`,
        company_id: targetCompany.id,
        email: cleanEmail,
        first_name: usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1),
        last_name: inferredRole === 'SUPER_ADMIN' ? 'Admin' : inferredRole === 'AUDITOR' ? 'Auditor' : 'Member',
        role: inferredRole,
        is_active: true,
        created_at: new Date().toISOString()
      };

      saveRegisteredUserLocal(fallbackUser, targetCompany, password);

      setState({
        isAuthenticated: true,
        token: `jwt-fallback-${fallbackUser.id}`,
        user: fallbackUser,
        company: targetCompany,
        currentRoute: 'workspace',
        activeWorkspaceTab: 'dashboard',
        isOnboarded: true
      });
      return { success: true, message: 'Connexion réussie !' };
    }

    return { success: false, message: 'Veuillez saisir une adresse e-mail valide et un mot de passe.' };
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

    // Pre-save all 3 demo roles to registered users
    (Object.keys(roleNames) as UserRole[]).forEach(r => {
      const u: User = {
        id: `usr-${r.toLowerCase()}-01`,
        company_id: demoCompany.id,
        email: roleNames[r].email,
        first_name: roleNames[r].first,
        last_name: roleNames[r].last,
        role: r,
        is_active: true,
        created_at: new Date().toISOString()
      };
      saveRegisteredUserLocal(u, demoCompany, 'password');
    });

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
