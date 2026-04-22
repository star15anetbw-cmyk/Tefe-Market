import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { User, Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { mapAuthError } from '../services/auth';

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
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  const fetchProfile = async (userId: string, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        // Timeout menor por tentativa para falhar rápido e tentar novamente
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na tentativa')), 5000)
        );

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

        if (error) {
          // PGRST116: Registro não encontrado (comum após cadastro novo enquanto a trigger roda)
          if (error.code === 'PGRST116' && i < retries - 1) {
            await new Promise(res => setTimeout(res, 1000));
            continue;
          }
          throw error;
        }
        return data as Profile;
      } catch (err) {
        console.warn(`Tentativa ${i + 1} de buscar perfil falhou:`, err);
        if (i === retries - 1) return null;
        // Espera progressiva antes da próxima tentativa
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
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
      setLoading(false);
      return;
    }

    let mounted = true;
    let authInitialized = false;

    // Safety timeout: libera o loading em no máximo 10 segundos
    const safetyTimer = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('Inicialização demorando demais, forçando renderização');
        setLoading(false);
      }
    }, 10000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Libera o loading principal assim que temos a sessão do usuário
        // O perfil pode carregar em background
        if (mounted) {
          authInitialized = true;
          setLoading(false);
          clearTimeout(safetyTimer);
        }

        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          if (mounted) setProfile(prof);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'INITIAL_SESSION' && authInitialized) return;

      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Se já estávamos bloqueados no loading e o evento chegou, liberamos
        if (mounted && !authInitialized) {
          authInitialized = true;
          setLoading(false);
          clearTimeout(safetyTimer);
        }
        
        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          if (mounted) setProfile(prof);
        } else {
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error('Auth change processing error:', err);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    session,
    loading,
    isConfigured,
    isAdmin: profile?.role === 'admin',
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
    signInWithGoogle: async () => {
      // Usamos uma rota de callback real (/auth/callback) para o fluxo PKCE
      // Isso evita conflitos com HashRouter e segue as melhores práticas de produção.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        throw new Error('Erro ao iniciar login com Google: ' + error.message);
      }
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 text-center">
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
