import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus, AlertCircle, Mail } from 'lucide-react';
import { NEIGHBORHOODS } from '../constants';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    neighborhood: NEIGHBORHOODS[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            whatsapp: formData.whatsapp,
            phone: formData.phone,
            neighborhood: formData.neighborhood,
          }
        }
      });

      setSuccess(true);
      window.scrollTo(0, 0);
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
    } catch (err: any) {
      console.error('GOOGLE_LOGIN_ERROR:', err);
      setError('Não foi possível iniciar o login com Google. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100">
          <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-6">
            <Mail className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Verifique seu e-mail!</h2>
          <p className="text-gray-500 mb-6 font-medium leading-relaxed">
            Quase lá! Enviamos um link de confirmação para <br/>
            <strong className="text-gray-900">{formData.email}</strong>. 
          </p>
          <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-500 mb-8 border border-gray-100 text-left">
            <p className="font-bold mb-1 uppercase tracking-widest text-[9px] text-gray-400">Dica importante:</p>
            Verifique também sua pasta de <strong>Spam</strong> ou <strong>Promoções</strong>. O link de ativação é necessário para começar a anunciar.
          </div>
          <Link to="/login" className="block w-full">
            <Button className="w-full py-4">Voltar para o Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12 px-4 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-emerald-900/5">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-50 rounded-2xl mb-4">
            <UserPlus className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crie sua conta</h1>
          <p className="text-gray-500">Comece a anunciar no Tefé Market hoje mesmo</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <Button 
            className="w-full h-14 text-base font-black relative overflow-hidden group shadow-lg shadow-emerald-200"
            onClick={handleGoogleLogin}
            loading={loading && !formData.email}
          >
            <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
            <div className="flex items-center justify-center gap-3">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Cadastrar com Google
            </div>
          </Button>

          <div className="py-2 flex items-center justify-between gap-4">
            <div className="h-px flex-grow bg-gray-100"></div>
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest px-2 whitespace-nowrap">Ou preencha manualmente</span>
            <div className="h-px flex-grow bg-gray-100"></div>
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Nome Completo"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <Input
            label="Senha (mínimo 6 caracteres)"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />

          <Input
            label="Telefone"
            placeholder="Ex: (97) 99123-4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="WhatsApp"
            placeholder="Ex: (97) 99123-4567"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            >
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2 mt-4">
            <Button type="submit" className="w-full" loading={loading}>
              Criar Conta
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-emerald-600 font-black hover:underline underline-offset-4 decoration-2">
            Faça login aqui
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
