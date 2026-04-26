import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, ChevronLeft, Save, CheckCircle2 } from 'lucide-react';
import { NEIGHBORHOODS } from '../constants';
import { cn } from '../lib/utils';

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    neighborhood: NEIGHBORHOODS[0]
  });

  useEffect(() => {
    console.log('EDIT_PROFILE_MOUNTED');
    if (profile) {
      setFormData({
        name: profile.name || '',
        whatsapp: profile.whatsapp || '',
        neighborhood: profile.neighborhood || NEIGHBORHOODS[0]
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    console.log('SUBMITTING_PROFILE_UPDATE', formData);
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        name: formData.name.trim(),
        whatsapp: formData.whatsapp.trim(),
        neighborhood: formData.neighborhood
      };

      console.log('PROFILE_UPDATE_PAYLOAD', payload);

      let { data, error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select()
        .single();

      // Se não encontrou a linha para update (ex: perfil não criado pelo trigger)
      if (updateError && (updateError.code === 'PGRST116' || updateError.message?.includes('0 rows'))) {
        console.warn('PROFILE_MISSING_TRYING_INSERT');
        const insertPayload = {
          id: user.id,
          ...payload
        };
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([insertPayload])
          .select()
          .single();
        
        if (insertError) {
          console.error('PROFILE_INSERT_ERROR', insertError);
          throw insertError;
        }
        data = insertData;
      } else if (updateError) {
        console.error('PROFILE_UPDATE_ERROR', updateError);
        throw updateError;
      }

      console.log('PROFILE_UPDATE_SUCCESS', data);

      // Atualiza o perfil no contexto global
      await refreshProfile();
      setSuccess(true);
      
      // Feedback visual e navegação
      setTimeout(() => {
        navigate('/perfil');
      }, 1500);
      
    } catch (err: any) {
      console.error('PROFILE_SAVE_CATCH', err);
      setError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4 pb-20">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/perfil')}
          className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Voltar para o Perfil
        </button>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-gray-100">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">Editar Perfil</h1>
          <p className="text-gray-400 text-sm font-medium">Atualize suas informações de contato.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-bold">Perfil atualizado com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome Completo / Comercial"
            placeholder="Ex: João da Castanha"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="uppercase"
          />

          <div>
            <Input
              label="WhatsApp para Contato (Obrigatório para anunciar)"
              placeholder="Ex: 97991234567"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              required
            />
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest leading-tight italic">
              Use o formato: DDD + Número (ex: 97991234567). Este número será o canal direto dos seus compradores.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Bairro de Atuação</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold transition-all"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            >
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className={cn(
                "w-full py-4 text-xs uppercase tracking-[0.2em] font-black flex items-center justify-center gap-2 rounded-xl transition-all",
                success ? "bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"
              )}
              loading={loading}
              disabled={success}
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
