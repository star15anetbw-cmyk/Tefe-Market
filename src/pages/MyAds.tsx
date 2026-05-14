import React, { useState, useEffect } from 'react';
import { fetchUserAds, deleteAd, updateAdStatus } from '../services/ads';
import { Ad } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {PlusCircle, AlertCircle, Trash2, Edit2, Heart} from 'lucide-react';
import Button from '../components/ui/Button';
import { formatPrice, formatAdPrice, cn, isNonCriticalSupabaseError, getAdCoverImage, handleImageError } from '../lib/utils';
import { FALLBACK_IMAGE } from '../constants';
import { Link } from 'react-router-dom';

export default function MyAds() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (user) {
      loadAds(controller.signal);
    }
    return () => controller.abort();
  }, [user]);

  const loadAds = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await fetchUserAds(user!.id, signal);
      if (!signal?.aborted) {
        setAds(data);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || isNonCriticalSupabaseError(err)) return;
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    // Se o usuário clicar pela primeira vez, entra em modo de confirmação
    if (deletingId !== id) {
      setDeletingId(id);
      // Reseta após 3 segundos se não confirmar
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      setLoading(true); // Feedback de carregamento global
      await deleteAd(id);
      setAds(prevAds => prevAds.filter(a => a.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erro ao excluir anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ad: Ad) => {
    const newStatus = ad.status === 'active' ? 'sold' : 'active';
    try {
      await updateAdStatus(ad.id, newStatus);
      setAds(ads.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  if (loading && ads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 pb-24 min-h-screen">
        <div className="bg-white p-6 rounded-2xl mb-8 border border-gray-100 animate-pulse">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-50 rounded w-1/4"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl p-4 h-32 border border-gray-100 animate-pulse flex gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                <div className="h-8 bg-gray-50 rounded w-full mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">Meus Anúncios</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Gerencie suas publicações</p>
        </div>
        <Link to="/publicar">
          <Button size="sm" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Anunciar</span>
          </Button>
        </Link>
      </div>

      {ads.length > 0 ? (
        <div className="space-y-4">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4 flex gap-4 transition-all hover:shadow-md">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                <img 
                  src={getAdCoverImage(ad.ad_images) || FALLBACK_IMAGE} 
                  alt={ad.title}
                  className={cn("w-full h-full object-cover", ad.status === 'sold' && "grayscale opacity-50")}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, ad.title)}
                />
                {ad.status === 'sold' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white px-2 py-0.5 rounded">Vendido</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-emerald-50 px-2 py-0.5 rounded">
                      {ad.category}
                    </span>
                    <span className="text-xs font-black text-primary">{formatAdPrice(ad.price, ad.ad_type)}</span>
                  </div>
                  <h3 className="font-black text-gray-900 line-clamp-1 text-sm sm:text-base">{ad.title}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {ad.neighborhood} • {new Date(ad.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant={ad.status === 'active' ? 'secondary' : 'outline'} 
                    size="sm" 
                    className="flex-1 text-[10px] py-2"
                    onClick={() => handleToggleStatus(ad)}
                  >
                    {ad.status === 'active' ? 'Marcar como vendido' : 'Ativar anúncio'}
                  </Button>
                  <Link to={`/editar/${ad.id}`}>
                    <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "p-2 transition-all",
                      deletingId === ad.id 
                        ? "text-white bg-red-600 hover:bg-red-700 rounded-lg px-4" 
                        : "text-gray-400 hover:text-red-500"
                    )}
                    onClick={() => handleDelete(ad.id)}
                  >
                    {deletingId === ad.id ? (
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        Confirmar?
                      </span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-100">
          <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">Nada por aqui ainda</h3>
          <p className="text-gray-400 text-sm mb-8">Você ainda não publicou nenhum anúncio no Tefé Market.</p>
          <Link to="/publicar">
            <Button>Começar a Vender</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
