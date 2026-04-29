import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAdById, updateAd, uploadAdImage, deleteAdImage, setPrimaryImage } from '../services/ads';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Camera, AlertCircle, ChevronLeft, Star, Trash2 } from 'lucide-react';
import { CATEGORIES, NEIGHBORHOODS, AD_TYPES, AD_CONDITIONS, SERVICE_CATEGORIES } from '../constants';
import { cn } from '../lib/utils';
import { Ad } from '../types';

export default function EditAd() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    ad_type: 'sale',
    condition: 'used',
    neighborhood: profile?.neighborhood || NEIGHBORHOODS[0]
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const MAX_IMAGES = 5;

  useEffect(() => {
    if (id) {
      loadAd(id);
    }
  }, [id]);

  const loadAd = async (adId: string) => {
    try {
      const ad = await fetchAdById(adId);
      if (user && ad.user_id !== user.id) {
        navigate('/meus-anuncios');
        return;
      }
      setFormData({
        title: ad.title,
        description: ad.description,
        price: ad.price.toString(),
        category: ad.category,
        ad_type: ad.ad_type,
        condition: ad.condition,
        neighborhood: ad.neighborhood
      });
      
      setExistingImages(ad.ad_images || []);
    } catch (err) {
      setError('Erro ao carregar anúncio.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrent = existingImages.length + newFiles.length;
    
    if (totalCurrent + files.length > MAX_IMAGES) {
      alert(`Você pode ter no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    setNewFiles([...newFiles, ...files]);

    (files as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExisting = async (imageId: string, imageUrl: string) => {
    try {
      setSaving(true);
      const isWasPrimary = existingImages.find(img => img.id === imageId)?.is_primary;
      
      await deleteAdImage(imageId, imageUrl);
      
      const newExisting = existingImages.filter(img => img.id !== imageId);
      setExistingImages(newExisting);
      
      // Se era a principal e ainda sobraram imagens, a primeira vira principal
      if (isWasPrimary && newExisting.length > 0) {
        await setPrimaryImage(id!, newExisting[0].id);
        setExistingImages(prev => prev.map(img => 
          img.id === newExisting[0].id ? { ...img, is_primary: true } : img
        ));
      }
    } catch (err) {
      alert('Erro ao remover imagem.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveNew = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      setSaving(true);
      await setPrimaryImage(id!, imageId);
      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
    } catch (err) {
      alert('Erro ao definir imagem principal.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    
    setSaving(true);
    setError(null);

    try {
      const priceStr = formData.price.toString().replace(',', '.');
      const price = parseFloat(priceStr);

      const adData: Partial<Ad> = {
        title: formData.title,
        description: formData.description,
        price: isNaN(price) ? 0 : price,
        category: formData.category,
        ad_type: formData.ad_type as any,
        condition: formData.ad_type === 'service' ? 'new' as any : formData.condition as any,
        neighborhood: formData.neighborhood,
      };

      await updateAd(id, adData);

      // Upload de novos arquivos
      if (newFiles.length > 0) {
        // Se não houver nenhuma imagem principal atual, a primeira nova será
        const hasPrimary = existingImages.some(img => img.is_primary);
        await Promise.all(
          newFiles.map((file, idx) => 
            uploadAdImage(id, user.id, file, !hasPrimary && idx === 0)
          )
        );
      }

      navigate('/meus-anuncios');
    } catch (err: any) {
      console.error("Erro ao atualizar anúncio:", err);
      setError(err.message || 'Erro ao atualizar anúncio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p className="text-gray-500 font-medium tracking-widest uppercase text-[10px]">Carregando...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 pb-20">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-black text-gray-900 mb-1 leading-tight">Editar anúncio</h1>
        <p className="text-gray-400 text-sm mb-8">Atualize as informações do seu anúncio no Tefé Market.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Gestão de Imagens */}
          <section>
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-text-muted">Gerenciar Fotos ({existingImages.length + newFiles.length}/{MAX_IMAGES})</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">* Defina o destaque clicando na estrela</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {/* Imagens Existentes */}
              {existingImages.map((img) => (
                <div key={img.id} className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border group shadow-sm transition-all",
                  img.is_primary ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-gray-200"
                )}>
                  <img src={img.image_url} alt="Ad" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button 
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        img.is_primary ? "bg-primary text-white" : "bg-white text-gray-400 hover:text-primary"
                      )}
                      title="Definir como principal"
                    >
                      <Star className={cn("w-4 h-4", img.is_primary && "fill-current")} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleRemoveExisting(img.id, img.image_url)}
                      className="p-2 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                      title="Excluir imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {img.is_primary && (
                    <div className="absolute bottom-0 left-0 w-full bg-primary/90 text-white text-[7px] font-black uppercase tracking-widest py-1 text-center">
                      Destaque
                    </div>
                  )}
                </div>
              ))}

              {/* Previews de Novas Fotos */}
              {previews.map((src, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm opacity-90 border-emerald-200 ring-1 ring-emerald-100">
                  <img src={src} alt={`New Preview ${index}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={() => handleRemoveNew(index)}
                      className="bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[6px] font-black px-1.5 py-0.5 uppercase tracking-tighter rounded-br">Novo</div>
                </div>
              ))}
              
              {/* Botão de Adicionar */}
              {(existingImages.length + newFiles.length) < MAX_IMAGES && (
                <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 transition-all group">
                  <Camera className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary/60">Adicionar</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </label>
              )}
            </div>
            {(existingImages.length + newFiles.length) > 0 && (
              <p className="text-[9px] text-gray-400 mt-3 font-medium italic">* Você pode ter até {MAX_IMAGES} fotos por anúncio.</p>
            )}
          </section>

          {/* Informações Básicas */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Título do Anúncio"
                placeholder="Ex: iPhone 13 Pro 128GB - Novo"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Descrição detalhada</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 min-h-[120px] text-sm"
                placeholder="Descreva o que está vendendo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <Input
              label="Preço (R$)"
              type="number"
              placeholder="0,00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
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
          </section>

          {/* Condição e Tipo */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-4 text-center md:text-left">Tipo de anúncio</label>
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                {AD_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      const newType = type.value as any;
                      const nextCategories = newType === 'service' ? SERVICE_CATEGORIES : CATEGORIES;
                      setFormData({ 
                        ...formData, 
                        ad_type: newType,
                        category: nextCategories.includes(formData.category) ? formData.category : nextCategories[0]
                      });
                    }}
                    className={cn(
                      'flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all',
                      formData.ad_type === type.value 
                        ? 'bg-white text-primary shadow-sm border border-gray-100' 
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            {formData.ad_type !== 'service' && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-4 text-center md:text-left">Condição</label>
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                  {AD_CONDITIONS.map(cond => (
                    <button
                      key={cond.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, condition: cond.value as any })}
                      className={cn(
                        'flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all',
                        formData.condition === cond.value 
                          ? 'bg-white text-primary shadow-sm border border-gray-100' 
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
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
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

          <div className="pt-4">
            <Button type="submit" className="w-full py-4 text-sm uppercase tracking-widest font-black" loading={saving}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
