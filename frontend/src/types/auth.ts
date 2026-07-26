export type UserRole = 'SUPER_ADMIN' | 'AUDITOR' | 'EMPLOYEE';

export interface User {
  id: string;
  company_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  country?: string;
  plan?: string;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  company: Company | null;
  currentRoute: 'landing' | 'login' | 'register_company' | 'forgot_password' | 'reset_password' | 'onboarding' | 'workspace';
  activeWorkspaceTab?: string;
  isOnboarded: boolean;
}

export interface RegisterCompanyPayload {
  admin_name: string;
  email: string;
  password: string;
  company_name: string;
  phone?: string;
  country?: string;
  terms_accepted: boolean;
}
