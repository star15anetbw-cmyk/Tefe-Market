import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { User, Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { mapAuthError } from '../services/auth';
import { isNonCriticalSupabaseError } from '../lib/utils';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<void>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<void>;
   signOut: () => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  const fetchProfile = async (userId: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, whatsapp, neighborhood, avatar_url, role, created_at, updated_at')
          .eq('id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116' && i < retries - 1) {
            await new Promise(res => setTimeout(res, 1500));
            continue;
          }
          throw error;
        }
        return data as Profile;
      } catch (err) {
        console.warn(`Tentativa ${i + 1} falhou:`, err);
        if (i === retries - 1) return null;
        await new Promise(res => setTimeout(res, 2000 * (i + 1)));
      }
    }
    return null;
  };

  useEffect(() => {
    // Avaliação robusta da configuração do Supabase
    const env = (import.meta as any).env || {};
    const url = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_ANON_KEY;
    
    const isActuallyConfigured = url && url !== 'undefined' && key && key !== 'undefined' && url.length > 5;
    
    if (!isActuallyConfigured) {
      setIsConfigured(false);
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    async function initAuth() {
      console.log("AUTH_INIT_START");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!mounted) return;
        
        const currentSession = data?.session || null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        console.log("AUTH_INIT_SUCCESS");
      } catch (err: any) {
        if (isNonCriticalSupabaseError(err)) {
          console.warn('Silent non-critical error in auth init:', err);
        } else {
          console.error('Auth initialization error:', err);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
          console.log("AUTH_INIT_FINISHED");
        }
      }
    }

    initAuth();

    // supabase.auth.onAuthStateChange subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug("AUTH_STATE_CHANGED", event);
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user?.id) {
        setProfile(null);
        setIsAdmin(false);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        console.debug("PROFILE_LOAD_START", { userId: user.id });
        const prof = await fetchProfile(user.id);

        if (cancelled) return;

        setProfile(prof);
        setIsAdmin(prof?.role === 'admin');
        console.debug("PROFILE_LOAD_SUCCESS", {
          userId: user.id,
          role: prof?.role
        });
      } catch (error) {
        if (cancelled) return;

        console.warn("PROFILE_LOAD_ERROR", error);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          console.debug("PROFILE_LOAD_FINISHED", { userId: user.id });
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loading = authLoading || (!!user && profileLoading);

  const value = {
    user,
    profile,
    session,
    loading,
    isConfigured,
    isAdmin,
    signIn: async (credentials: SignInWithPasswordCredentials) => {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw new Error(mapAuthError(error));
    },
    signUp: async (credentials: SignUpWithPasswordCredentials) => {
      const { error } = await supabase.auth.signUp(credentials);
      if (error) throw new Error(mapAuthError(error));
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(mapAuthError(error));
    },
  signInWithGoogle: async (redirectTo?: string) => {
    if (redirectTo) {
      localStorage.setItem('auth_redirect_next', redirectTo);
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      throw new Error('Erro ao iniciar login com Google: ' + error.message);
    }
  },
    refreshProfile: async () => {
      if (user) {
        const prof = await fetchProfile(user.id);
        setProfile(prof);
        setIsAdmin(prof?.role === 'admin');
      }
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="w-16 h-16 bg-emerald-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Configuração Necessária</h1>
          <p className="text-gray-500 text-sm mb-6">
            As credenciais do Supabase não foram encontradas. Para que o Tefé Market funcione, você precisa configurar as variáveis de ambiente no menu de configurações.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left text-xs font-mono text-gray-600 mb-6 border border-gray-100">
            <div>VITE_SUPABASE_URL=...</div>
            <div className="mt-1">VITE_SUPABASE_ANON_KEY=...</div>
          </div>
          <p className="text-xs text-gray-400">
            Obtenha essas chaves no dashboard do seu projeto Supabase em Settings &gt; API.
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
