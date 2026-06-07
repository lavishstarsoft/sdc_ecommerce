import { supabase, isSupabaseConfigured } from './supabase';

export interface AdminUser {
  email: string;
  id?: string;
}

/**
 * Signs in an admin user using Supabase auth, or mock credentials if not configured.
 */
export const loginAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to authenticate via Supabase Auth.' };
    }
  }

  // Local Mock Mode Auth Fallback
  const defaultEmail = "admin@sdc.com";
  const defaultPassword = "admin123";

  if (email.toLowerCase() === defaultEmail && password === defaultPassword) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdc_admin_token', 'mock-session-token-active');
      localStorage.setItem('sdc_admin_user', JSON.stringify({ email: defaultEmail }));
    }
    return { success: true };
  } else {
    return { success: false, error: 'Invalid admin email or password.' };
  }
};

/**
 * Logs out the currently active admin user.
 */
export const logoutAdmin = async (): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Failed to logout from Supabase Auth:', e);
    }
  }

  // Local Mock Mode Cleanup
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sdc_admin_token');
    localStorage.removeItem('sdc_admin_user');
  }
};

/**
 * Returns the currently signed-in admin user, or null if unauthenticated.
 */
export const getAdminUser = async (): Promise<AdminUser | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return { email: user.email || '', id: user.id };
      }
      return null;
    } catch (e) {
      console.warn('Failed to load user from Supabase:', e);
      return null;
    }
  }

  // Local Mock Mode Session Check
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sdc_admin_token');
    const userJson = localStorage.getItem('sdc_admin_user');
    if (token === 'mock-session-token-active' && userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
  }
  return null;
};
