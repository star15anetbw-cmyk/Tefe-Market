import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      // O Supabase lida automaticamente com a extração do código/token da URL 
      // ao chamar getSession ou onAuthStateChange. No modo PKCE, ele troca o código.
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AUTH_CALLBACK_ERROR:', error.message);
        navigate('/login?error=' + encodeURIComponent(error.message));
        return;
      }

      if (data.session) {
        navigate('/');
      } else {
        // Verificamos se houve algum problema ou se apenas precisamos de mais tempo
        // para o listener do AuthContext disparar.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          navigate('/');
        } else {
          navigate('/login');
        }
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Finalizando acesso</h2>
        <p className="text-gray-500">Aguarde um momento enquanto preparamos tudo...</p>
      </div>
    </div>
  );
}
