import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createAd, uploadAdImage } from '../services/ads';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Camera, AlertCircle, MessageSquare, Tag, LayoutGrid, User, Phone, ShieldCheck } from 'lucide-react';
import { CATEGORIES, NEIGHBORHOODS, AD_TYPES, AD_CONDITIONS, SERVICE_CATEGORIES } from '../constants';
import { cn, handleImageError } from '../lib/utils';
import { FALLBACK_IMAGE } from '../constants';

export default function CreateExternalAd() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    ad_type: 'sale',
    condition: 'used',
    neighborhood: NEIGHBORHOODS[0],
    priceNegotiable: false,
    external_seller_name: '',
    external_seller_phone: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const MAX_IMAGES = 5;

  // Proteção extra: só admin pode estar aqui
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-20 px-4 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Acesso Restrito</h1>
        <p className="text-gray-500 mb-6">Apenas administradores podem criar anúncios externos.</p>
        <Button onClick={() => navigate('/')}>Voltar para o início</Button>
      </div>
    );
  }

  const selectAdType = (type: string) => {
    const nextCategories = type === 'service' ? SERVICE_CATEGORIES : CATEGORIES;
    setFormData(prev => ({
      ...prev,
      ad_type: type,
      category: nextCategories[0],
      priceNegotiable: false
    }));
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > MAX_IMAGES) {
      alert(`Você pode enviar no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    const newFiles = [...images, ...files];
    setImages(newFiles);

    (files as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.external_seller_phone) {
      setError("O telefone do anunciante é obrigatório para anúncios externos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceStr = formData.price.toString().replace(',', '.');
      const price = parseFloat(priceStr);
      
      // 1. Criar o anúncio (dados textuais)
      const adData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: isNaN(price) ? 0 : price,
        category: formData.category,
        ad_type: formData.ad_type as any,
        condition: formData.ad_type === 'service' ? 'new' as any : formData.condition as any,
        neighborhood: formData.neighborhood,
        status: 'active' as const,
        is_external: true,
        external_seller_name: formData.external_seller_name,
        external_seller_phone: formData.external_seller_phone
      };

      const newAd = await createAd(adData);

      // 2. Fazer upload das imagens se houverem
      if (images.length > 0 && newAd) {
        await Promise.all(
          images.map((img, index) => uploadAdImage(newAd.id, user.id, img, index === 0))
        );
      }

      alert('Anúncio externo criado com sucesso!');
      navigate('/admin');
    } catch (err: any) {
      console.error("Erro ao publicar anúncio externo:", err);
      setError(err.message || 'Erro ao publicar anúncio externo.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4 pb-20">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Novo Anúncio Manual</h1>
          <p className="text-gray-400 font-medium mb-8 italic">Cadastre anúncios coletados de fontes externas (WhatsApp, Grupos, etc).</p>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => selectAdType('sale')}
              className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all group text-left"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Tag className="w-7 h-7 text-primary group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Anunciar Venda</h3>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Produtos em geral</p>
              </div>
            </button>

            <button 
              onClick={() => selectAdType('rent')}
              className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-blue-600 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutGrid className="w-7 h-7 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Anunciar Aluguel</h3>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Imóveis e utilitários</p>
              </div>
            </button>

            <button 
              onClick={() => selectAdType('service')}
              className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-purple-600 hover:bg-purple-50 transition-all group text-left"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <MessageSquare className="w-7 h-7 text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Anunciar Serviço</h3>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Profissionais e serviços</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 pb-20">
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md text-white",
                formData.ad_type === 'sale' ? "bg-primary" : formData.ad_type === 'rent' ? "bg-blue-600" : "bg-purple-600"
              )}>
                MODO ADMIN
              </span>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">An anúncio Externo</h1>
            </div>
            <p className="text-gray-400 text-sm italic">O WhatsApp levará direto para o anunciante informado.</p>
          </div>
          <button 
            type="button"
            onClick={() => setStep(0)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 transition-all w-fit"
          >
            Alterar tipo
          </button>
        </div>

        {loading && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700 animate-pulse">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Otimizando imagens e publicando...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Dados do Anunciante Externo */}
        <section className="bg-emerald-50 p-6 rounded-2xl border-2 border-dashed border-emerald-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-emerald-600" />
            <h2 className="text-[11px] font-black uppercase tracking-widest text-emerald-700">Dados do Anunciante Real</h2>
          </div>
          <Input
            label="Nome do Anunciante (Opcional)"
            placeholder="Ex: João do WhatsApp"
            value={formData.external_seller_name}
            onChange={(e) => setFormData({ ...formData, external_seller_name: e.target.value })}
            className="bg-white"
          />
          <Input
            label="WhatsApp do Anunciante"
            placeholder="Ex: 97984050000"
            value={formData.external_seller_phone}
            onChange={(e) => setFormData({ ...formData, external_seller_phone: e.target.value })}
            required
            className="bg-white"
          />
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Múltiplas Imagens */}
          <section>
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-text-muted">Fotos ({previews.length}/{MAX_IMAGES})</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">* A primeira será o destaque</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                  <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" onError={(e) => handleImageError(e, `External Ad Preview ${index}`)} />
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <AlertCircle className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 w-full bg-primary/90 text-white text-[7px] font-black uppercase tracking-widest py-1 text-center">
                      Principal
                    </div>
                  )}
                </div>
              ))}
              
              {previews.length < MAX_IMAGES && (
                <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-all group">
                  <Camera className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary/60">Adicionar</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </label>
              )}
            </div>
          </section>

          {/* Informações Básicas */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Título do Anúncio"
                placeholder="Ex: iPhone 13 Pro 128GB"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Descrição detalhada</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 min-h-[120px] text-sm"
                placeholder="Descreva detalhes importantes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Categoria</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {(formData.ad_type === 'service' ? SERVICE_CATEGORIES : CATEGORIES).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
              {formData.priceNegotiable ? (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100 mt-0 transition-all duration-300">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Valor a combinar</span>
                </div>
              ) : (
                <Input
                  label="Preço (R$)"
                  type="number"
                  placeholder="0,00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              )}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10 mt-2 animate-in fade-in zoom-in-95 duration-200">
                <input 
                  type="checkbox" 
                  id="priceNegotiableExternal"
                  checked={formData.priceNegotiable}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    priceNegotiable: e.target.checked,
                    price: e.target.checked ? '0' : (formData.price === '0' ? '' : formData.price)
                  })}
                  className="w-5 h-5 text-primary rounded-md border-gray-300 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="priceNegotiableExternal" className="text-[11px] font-black uppercase tracking-widest text-primary cursor-pointer select-none">
                  Preço a combinar
                </label>
              </div>

            {formData.ad_type === 'sale' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Condição do Produto</label>
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 w-full sm:w-64">
                  {AD_CONDITIONS.map(cond => (
                    <button
                      key={cond.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, condition: cond.value })}
                      className={cn(
                        'flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded transition-all',
                        formData.condition === cond.value 
                          ? 'bg-white text-primary shadow-md border border-gray-100' 
                          : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Localização */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 text-left">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Bairro</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              >
                {NEIGHBORHOODS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </section>

          <Button type="submit" className="w-full py-5 text-[12px] uppercase tracking-[0.2em] font-black shadow-xl shadow-primary/20" loading={loading}>
            Publicar Anúncio Externo
          </Button>
        </form>
      </div>
    </div>
  );
}
