import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAdById } from '../services/ads';
import { Ad } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { MapPin, Clock, Tag, MessageCircle, Share2, ChevronLeft, User, Heart, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { checkIsFavorited, toggleFavorite } from '../services/favorites';
import { getOrCreateChat } from '../services/chat';

export default function AdDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadAd(id);
      if (user) {
        checkIsFavorited(user.id, id).then(setIsFavorited);
      }
    }
  }, [id, user]);

  const loadAd = async (adId: string) => {
    try {
      const data = await fetchAdById(adId);
      setAd(data);
    } catch (err) {
      console.error('Error fetching ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !ad) {
      navigate('/login');
      return;
    }

    if (isToggling) return;

    try {
      setIsToggling(true);
      const previousState = isFavorited;
      setIsFavorited(!previousState);
      await toggleFavorite(user.id, ad.id, previousState);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      checkIsFavorited(user.id, ad.id).then(setIsFavorited);
    } finally {
      setIsToggling(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !ad) {
      navigate('/login');
      return;
    }

    if (user.id === ad.user_id) {
      alert('Você não pode iniciar um chat com seu próprio anúncio.');
      return;
    }

    try {
      const chatId = await getOrCreateChat(ad.id, user.id, ad.user_id);
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p className="text-gray-500 font-medium">Carregando detalhes...</p>
    </div>
  );

  if (!ad) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Anúncio não encontrado</h2>
      <Link to="/" className="text-emerald-600 font-bold hover:underline">Voltar para o início</Link>
    </div>
  );

  // Guards defensivos para evitar crash de renderização
  const profileData = Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles;
  const sellerName = profileData?.name || 'Vendedor Anônimo';
  const whatsappNumber = profileData?.whatsapp || '';
  
  // Ordenar imagens para garantir que a primária seja a primeira do array
  const images = [...(ad.ad_images || [])].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return 0;
  });

  if (images.length === 0) {
    images.push({ 
      id: 'placeholder', 
      ad_id: ad.id, 
      image_url: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      is_primary: true,
      sort_order: 0
    });
  }

  const shareAd = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title || 'Anúncio no Tefé Market',
          text: ad.description || '',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failure:', err);
      }
    }
  };

  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/55${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi seu anúncio "${ad.title}" no Tefé Market e gostaria de mais informações.`)}`
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleFavorite}
            className={cn(
              "p-2.5 rounded-full shadow-md border transition-all active:scale-95",
              isFavorited 
                ? "bg-red-500 text-white border-red-400" 
                : "bg-white text-gray-400 border-gray-100 hover:text-red-500"
            )}
            title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
          </button>
          
          <button 
            onClick={shareAd}
            className="p-2.5 bg-white rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-primary transition-all active:scale-95"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          Link copiado!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <img 
              src={images[0].image_url} 
              alt={ad.title} 
              className="w-full aspect-[4/3] object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Imagem+Indisponível';
              }}
            />
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.slice(1).map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden shadow-sm aspect-square bg-white border border-gray-200">
                  <img 
                    src={img.image_url} 
                    alt={`${ad.title} - ${i + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Erro';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={cn(
                "px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded",
                ad.ad_type === 'sale' ? "bg-primary text-white" : "bg-blue-600 text-white"
              )}>
                {ad.ad_type === 'sale' ? 'Venda' : 'Aluguel'}
              </span>
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded bg-gray-100 text-gray-600">
                {ad.condition === 'new' ? 'Novo' : 'Usado'}
              </span>
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded bg-secondary/10 text-secondary flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                {ad.category}
              </span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
              {ad.title}
            </h1>

            <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400 mb-6 uppercase tracking-wider">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-gray-300" />
                {ad.created_at ? formatDate(ad.created_at) : 'Data indisponível'}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-gray-300" />
                {ad.neighborhood || 'Tefé'}, Tefé
              </div>
            </div>

            <div className="text-3xl font-black text-primary mb-8">
              {formatPrice(ad.price || 0)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleStartChat}
                className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 col-span-2 text-sm uppercase tracking-wider"
              >
                <MessageSquare className="w-5 h-5" />
                Chat com Vendedor
              </button>
              
              {whatsappUrl ? (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-secondary text-white font-bold py-3.5 rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-secondary/20 col-span-2 sm:col-span-1 text-sm uppercase tracking-wider"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              ) : (
                <button 
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-bold py-3.5 rounded-lg cursor-not-allowed col-span-2 sm:col-span-1 text-[10px] uppercase tracking-wider"
                  disabled
                  title="Vendedor não informou WhatsApp"
                >
                  WhatsApp Indisponível
                </button>
              )}
              
              <button 
                onClick={shareAd}
                className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 font-bold py-3.5 rounded-lg hover:bg-gray-100 transition-all active:scale-95 col-span-2 sm:col-span-1 border border-gray-200 text-sm uppercase tracking-wider"
              >
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-black text-text-muted uppercase tracking-[0.2em] mb-4 border-b border-gray-100 pb-2">
              Descrição
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {ad.description || 'Nenhuma descrição fornecida.'}
            </p>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">Anunciante</p>
              <h3 className="text-md font-bold text-gray-900">{sellerName}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
