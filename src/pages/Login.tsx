import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // O redirecionamento acontece via popup e listener
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-emerald-900/5">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-50 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h1>
          <p className="text-gray-500">Acesse sua conta no Tefé Market</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-px flex-grow bg-gray-100"></div>
          <span className="text-xs text-gray-400 uppercase font-bold px-2">ou</span>
          <div className="h-px flex-grow bg-gray-100"></div>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-6"
          onClick={handleGoogleLogin}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
          Entrar com Google
        </Button>

        <p className="mt-8 text-center text-sm text-gray-500">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="text-emerald-600 font-bold hover:underline">
            Crie sua conta aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
