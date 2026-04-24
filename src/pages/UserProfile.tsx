import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Bell, HelpCircle, Shield, LogOut, ChevronRight, MapPin, Phone, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

/**
 * Tefé Market - Tela de Perfil (UserProfile.tsx)
 * Reconstruída com base na UI real identificada no diagnóstico.
 */
export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log('%c [PROFILE_REAL_UI_V2.0_MOUNTED] ', 'background: #064e3b; color: #fff; font-size: 16px; font-weight: bold;');
  }, []);

  const handleAction = (path: string, label: string) => {
    console.log(`%c CLIQUE_DETECTADO: ${label} `, 'background: #f97316; color: #fff; font-weight: bold;');
    if (path !== '#') {
      navigate(path);
    }
  };

  const handleSignOut = async () => {
    console.log('CLIQUE_DETECTADO: SAIR');
    await signOut();
    navigate('/login');
  };

  const handleQuickWhatsApp = async (value: string) => {
    if (!user || !value) return;
    console.log('QUICK_SAVE_WHATSAPP', value);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          whatsapp: value.trim(),
          updated_at: new Date().toISOString() 
        });
      
      if (error) throw error;
      
      await refreshProfile();
    } catch (err) {
      console.error('Error saving quick whatsapp:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 min-h-screen relative bg-bg-main overflow-x-hidden">
      
      {/* Banner de Verificação de Versão - Para o usuário saber que esta é a tela nova */}
      <div className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] py-2 text-center rounded-xl mb-4 shadow-sm">
        Perfil Atualizado v2.0 - [Sincronizado]
      </div>

      {/* Bloco Superior: Informações do Usuário */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-6 text-center">
        <div className="w-24 h-24 bg-emerald-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100/50">
          <User className="w-12 h-12" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">
          {profile?.name || 'Vendedor Tefé'}
        </h1>
        
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">
          {user?.email}
        </p>

        {/* Bloco de Cards: Bairro e Contato */}
        <div className="grid grid-cols-2 gap-4 text-left">
          {/* Card Bairro */}
          <div className="bg-gray-50/50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Bairro</p>
              <p className="text-xs font-bold text-gray-700 truncate">{profile?.neighborhood || 'Tefé'}</p>
            </div>
          </div>

          {/* Card Contato - Tornando clicável para navegar para editar */}
          <div 
            onClick={() => handleAction('/perfil/editar', 'Contato_Header_Card')}
            role="button"
            tabIndex={0}
            className={cn(
              "rounded-2xl p-4 flex items-center gap-3 border transition-all cursor-pointer active:scale-95 group shadow-sm",
              profile?.whatsapp ? "bg-gray-50/50 border-gray-100" : "bg-amber-50 border-amber-200 animate-pulse"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
              profile?.whatsapp ? "bg-white text-primary" : "bg-amber-100 text-amber-600"
            )}>
              <Phone className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className={cn(
                "text-[8px] font-black uppercase tracking-widest leading-none mb-1",
                profile?.whatsapp ? "text-gray-400" : "text-amber-600"
              )}>
                {profile?.whatsapp ? 'WhatsApp' : 'Ação Requerida'}
              </p>
              <p className={cn(
                "text-xs font-bold truncate transition-colors",
                profile?.whatsapp ? "text-gray-700" : "text-amber-700"
              )}>
                {profile?.whatsapp || 'Adicionar WhatsApp'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Alerta e Entrada Rápida se WhatsApp estiver faltando */}
      {!profile?.whatsapp && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[32px] p-6 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight leading-none mb-1">WhatsApp Obrigatório</h3>
              <p className="text-[10px] text-amber-700 font-medium leading-tight">Para vender no Tefé Market, insira seu número abaixo.</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <input 
                type="tel"
                placeholder="Ex: 97991234567"
                id="quick-whatsapp"
                className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) handleQuickWhatsApp(val);
                  }
                }}
              />
            </div>
            <button 
              onClick={() => {
                const input = document.getElementById('quick-whatsapp') as HTMLInputElement;
                if (input.value) handleQuickWhatsApp(input.value);
              }}
              className="bg-amber-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-amber-600/20"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Menu Principal */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mb-8">
        
        {/* Item: MINHA CONTA */}
        <div
          onClick={() => handleAction('/perfil/editar', 'Minha_Conta')}
          role="button"
          tabIndex={0}
          className="flex items-center justify-between p-6 hover:bg-emerald-50/50 transition-all cursor-pointer border-b border-gray-50 active:scale-[0.98] relative z-10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Minha Conta</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Dados Pessoais e Segurança</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>

        {/* Item: NOTIFICAÇÕES (Em breve) */}
        <div className="flex items-center justify-between p-6 opacity-50 bg-gray-50/30 border-b border-gray-50 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center border border-gray-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-tight leading-none mb-1">Notificações</h4>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none">Alertas de chat e novos anúncios</p>
            </div>
          </div>
          <span className="text-[6px] bg-amber-100/50 text-amber-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Em breve</span>
        </div>

        {/* Outras opções (Privacidade, Ajuda) podem ser adicionadas aqui se existirem no futuro */}
      </div>

      {/* Botão de Logout */}
      <div className="px-2">
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full gap-2 border-red-50 text-red-500 hover:bg-red-50 hover:border-red-100 py-4 uppercase font-black tracking-widest text-[10px] shadow-sm bg-white active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </Button>
      </div>

      <div className="mt-8 text-center pb-8 text-gray-300">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Tefé Market v2.0.0</p>
      </div>
    </div>
  );
}
