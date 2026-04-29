import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createAd, uploadAdImage } from '../services/ads';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Camera, AlertCircle, MessageSquare, Tag, LayoutGrid } from 'lucide-react';
import { CATEGORIES, NEIGHBORHOODS, AD_TYPES, AD_CONDITIONS, SERVICE_CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

export default function CreateAd() {
  const { user, profile } = useAuth();
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
    neighborhood: profile?.neighborhood || NEIGHBORHOODS[0],
    priceNegotiable: false
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const MAX_IMAGES = 5;

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

  // Sincroniza bairro quando o perfil carregar
  React.useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        neighborhood: prev.neighborhood || profile.neighborhood || NEIGHBORHOODS[0]
      }));
    }
  }, [profile]);

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
        condition: formData.ad_type === 'service' ? 'new' as any : formData.condition as any, // Default to 'new' for services but UI handles it
        neighborhood: formData.neighborhood,
        status: 'active' as const
      };

      const newAd = await createAd(adData);

      // 2. Fazer upload das imagens se houverem
      if (images.length > 0 && newAd) {
        // Enviar todas as imagens. A primeira será a principal (index === 0)
        await Promise.all(
          images.map((img, index) => uploadAdImage(newAd.id, user.id, img, index === 0))
        );
      }

      navigate('/meus-anuncios');
    } catch (err: any) {
      console.error("Erro ao publicar anúncio:", err);
      setError(err.message || 'Erro ao publicar anúncio.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4 pb-20">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">O que você deseja anunciar?</h1>
          <p className="text-gray-400 font-medium mb-8">Escolha uma opção para começar</p>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => selectAdType('sale')}
              className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all group text-left"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Tag className="w-7 h-7 text-primary group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Vender</h3>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Produtos novos ou usados</p>
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
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Alugar</h3>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Casas, quartos, pontos e outros</p>
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
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Serviços</h3>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Diarista, pedreiro, frete e mais</p>
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
                {formData.ad_type === 'sale' ? 'Venda' : formData.ad_type === 'rent' ? 'Aluguel' : 'Serviços'}
              </span>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">Anunciar {formData.ad_type === 'sale' ? 'Produto' : formData.ad_type === 'rent' ? 'Imóvel' : 'Serviço'}</h1>
            </div>
            <p className="text-gray-400 text-sm italic">Preencha os detalhes e publique rápido.</p>
          </div>
          <button 
            type="button"
            onClick={() => setStep(0)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 transition-all w-fit"
          >
            Alterar tipo
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!profile?.whatsapp && (
          <div className="mb-8 p-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center text-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-amber-900 uppercase tracking-tighter">WhatsApp Obrigatório</h3>
              <p className="text-amber-700/70 text-xs font-medium max-w-xs mt-1">
                Para sua segurança e dos compradores, cadastre seu WhatsApp no perfil antes de publicar.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/perfil/editar')}
              className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-600/20 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest h-auto"
            >
              Definir agora
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={cn("space-y-8", !profile?.whatsapp && "opacity-40 pointer-events-none grayscale select-none")}>
          {/* Múltiplas Imagens */}
          <section>
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-text-muted">Fotos ({previews.length}/{MAX_IMAGES})</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">* A primeira será o destaque</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                  <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
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
                placeholder={formData.ad_type === 'sale' ? "Ex: iPhone 13 Pro 128GB - Novo" : formData.ad_type === 'rent' ? "Ex: Casa com 2 quartos no Centro" : "Ex: Diarista com experiência"}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Descrição detalhada</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 min-h-[120px] text-sm"
                placeholder={formData.ad_type === 'service' ? "Descreva seu serviço, horários e experiência..." : "Descreva detalhes importantes..."}
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
            
            <div className="space-y-1">
              <Input
                label="Preço (R$)"
                type="number"
                placeholder="0,00"
                value={formData.priceNegotiable ? '' : formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required={!formData.priceNegotiable}
                disabled={formData.priceNegotiable}
                className={cn(
                  "transition-all",
                  formData.priceNegotiable ? "bg-gray-100 opacity-50 cursor-not-allowed" : ""
                )}
              />
              {formData.ad_type === 'service' && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50/50 border border-purple-100/50 mt-2 animate-in fade-in zoom-in-95 duration-200">
                  <input 
                    type="checkbox" 
                    id="priceNegotiableCreate"
                    checked={formData.priceNegotiable}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      priceNegotiable: e.target.checked,
                      price: e.target.checked ? '0' : (formData.price === '0' ? '' : formData.price)
                    })}
                    className="w-5 h-5 text-primary rounded-md border-gray-300 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="priceNegotiableCreate" className="text-[11px] font-black uppercase tracking-widest text-purple-700 cursor-pointer select-none">
                    Preço a combinar
                  </label>
                </div>
              )}
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

          <div className="pt-4 px-2">
            <Button type="submit" className="w-full py-5 text-[12px] uppercase tracking-[0.2em] font-black shadow-xl shadow-primary/20" loading={loading}>
              Publicar Agora
            </Button>
            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-4">
              Ao publicar, você concorda com os termos do Tefé Market.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
