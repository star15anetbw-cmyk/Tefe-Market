import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock, LogIn, AlertCircle, Chrome } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const next = searchParams.get('next');

  useEffect(() => {
    if (user) {
      navigate(next || '/', { replace: true });
    }
  }, [user, navigate, next]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn({ email, password });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle(next || '/');
    } catch (err: any) {
      console.error('GOOGLE_LOGIN_ERROR:', err);
      setError('Não foi possível iniciar o login com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4 mb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-emerald-50 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bem-vindo!</h1>
          <p className="text-gray-500 mt-1 font-medium">Acesse sua conta no Tefé Market</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <Button 
            className="w-full h-14 text-base font-black relative overflow-hidden group shadow-lg shadow-emerald-200"
            onClick={handleGoogleLogin}
            loading={loading}
          >
            <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
            <div className="flex items-center justify-center gap-3">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Continuar com Google
            </div>
          </Button>

          <div className="py-4 flex items-center justify-between gap-4">
            <div className="h-px flex-grow bg-gray-100"></div>
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest px-2 whitespace-nowrap">Ou use seu e-mail</span>
            <div className="h-px flex-grow bg-gray-100"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              icon={<Lock className="w-4 h-4" />}
            />
            
            <button type="submit" className="hidden" />
            <Button variant="secondary" type="submit" className="w-full h-12 font-bold" loading={loading && !!email}>
              Entrar com E-mail
            </Button>
          </form>
        </div>

        <p className="mt-10 text-center text-sm text-gray-400 font-medium tracking-tight">
          Novo por aqui?{' '}
          <Link to="/cadastro" className="text-emerald-600 font-black hover:underline underline-offset-4 decoration-2">
            Crie sua conta rapidinho
          </Link>
        </p>
      </div>
    </div>
  );
}
