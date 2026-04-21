import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Shield, Bell, HelpCircle, LogOut, ChevronRight, MapPin, Phone } from 'lucide-react';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Minha Conta', description: 'Dados pessoais e segurança', path: '#' },
    { icon: Bell, label: 'Notificações', description: 'Alertas de chat e novos anúncios', path: '#' },
    { icon: Shield, label: 'Privacidade', description: 'Controle o que os outros veem', path: '#' },
    { icon: HelpCircle, label: 'Ajuda', description: 'Termos de uso e suporte', path: '#' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6 text-center">
        <div className="w-24 h-24 bg-emerald-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100/50">
          <User className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">
          {profile?.name || 'Vendedor Tefé'}
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
          {user?.email || 'membro@tefemarket.com'}
        </p>

        <div className="flex justify-center gap-4 text-left">
          <div className="bg-gray-50 rounded-2xl p-3 flex-1 flex items-center gap-3 border border-gray-100">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Bairro</p>
              <p className="text-xs font-bold text-gray-700">{profile?.neighborhood || 'Tefé - AM'}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3 flex-1 flex items-center gap-3 border border-gray-100">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Contato</p>
              <p className="text-xs font-bold text-gray-700">{profile?.whatsapp || 'Não definido'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {menuItems.map((item, index) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center justify-between p-5 hover:bg-gray-50 transition-colors",
              index !== menuItems.length - 1 && "border-b border-gray-50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">{item.label}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
      </div>

      <Button 
        variant="outline" 
        onClick={handleSignOut}
        className="w-full gap-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 py-4 uppercase font-black tracking-widest text-xs"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Tefé Market v1.0.0</p>
      </div>
    </div>
  );
}
