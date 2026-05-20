import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load directly from import.meta.env which is the standard Vite way
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Strict check for valid configuration strings
const isConfigured = (val: any) => val && val !== 'undefined' && val !== 'null' && val.length > 10;
const isDevelopment = env.DEV === true || env.MODE === 'development';

/**
 * Validates the Supabase configuration before creating the client.
 */
const createResilientSupabaseClient = (): SupabaseClient => {
  if (!isConfigured(supabaseUrl) || !isConfigured(supabaseAnonKey)) {
    if (isDevelopment) {
      console.warn('Supabase env vars missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    // Return a dummy object that throws a helpful error when any property is accessed
    return new Proxy({} as SupabaseClient, {
      get: (_, prop) => {
        // Fallback for auth-ready checks in contexts
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        
        // Throw a descriptive error for any other attempt to use the client
        const errorMessage = `Supabase configuration error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. Please check your project settings.`;
        throw new Error(errorMessage);
      }
    });
  }

  // Create a single, stable client instance
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true, // Permite que o SDK gerencie a renovação do token
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "tefe-market-auth"
    }
  });
};

export const supabase = createResilientSupabaseClient();
