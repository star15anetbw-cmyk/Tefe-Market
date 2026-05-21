import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAdById, logAdClick, fetchAds, incrementAdViewsCount, incrementAdWhatsAppClicks, incrementAdShares } from '../services/ads';
import { Ad } from '../types';
import { formatPrice, formatAdPrice, formatDate, cn, isNonCriticalSupabaseError, handleImageError } from '../lib/utils';
import { FALLBACK_IMAGE } from '../constants';
import { MapPin, Clock, Tag, MessageCircle, Share2, ChevronLeft, ChevronRight, User, Heart, MessageSquare, BadgeCheck, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../components/ui/Button';
import AdCard from '../components/AdCard';
import { useAuth } from '../contexts/AuthContext';
import { checkIsFavorited, toggleFavorite } from '../services/favorites';
import { getOrCreateChat } from '../services/chat';

export default function AdDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const loadedAdIdRef = useRef<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadingDetailRef = useRef(false);
  const currentAdIdRef = useRef<string | null>(null);
  
  // Anúncios relacionados
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const hasLoadedRelatedRef = useRef<string | null>(null);
  
  // Galeria de imagens
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Ordenar imagens para garantir que a primária seja a primeira do array de forma estável
  const images = React.useMemo(() => {
    const rawImages = ad?.ad_images || [];
    if (rawImages.length === 0) {
      return [{ 
        id: 'placeholder', 
        ad_id: ad?.id || '', 
        image_url: FALLBACK_IMAGE,
        is_primary: true,
        sort_order: 0
      }];
    }
    
    return [...rawImages].sort((a, b) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      const orderA = typeof a.sort_order === 'number' ? a.sort_order : 999;
      const orderB = typeof b.sort_order === 'number' ? b.sort_order : 999;
      return orderA - orderB;
    });
  }, [ad]);

  const nextImage = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length <= 1) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, nextImage, prevImage]);

  // Rolar para o topo ao trocar de anúncio
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (id) {
      loadAd(id);
    } else {
      currentAdIdRef.current = null;
      loadingDetailRef.current = false;
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    if (!id || !user?.id) {
      setIsFavorited(false);
      return;
    }

    checkIsFavorited(user.id, id)
      .then((favorited) => {
        if (!cancelled) setIsFavorited(favorited);
      })
      .catch((error) => console.debug('Favorite status error ignored', error));

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  // Carregar anúncios relacionados quando o anúncio principal estiver pronto
  useEffect(() => {
    if (ad && ad.id !== hasLoadedRelatedRef.current) {
      loadRelatedAds();
    }
  }, [ad]);

  const loadRelatedAds = async () => {
    if (!ad) return;
    
    console.debug('DETAIL_RELATED_START', { category: ad.category, id: ad.id });
    setRelatedLoading(true);
    hasLoadedRelatedRef.current = ad.id;

    try {
      // 1. Tentar mesma categoria (limitando a 12 para ter gordura de filtro)
      const result = await fetchAds({ 
        category: ad.category, 
        pageSize: 12 
      });
      
      let filtered = (result.ads || []).filter(a => a.id !== ad.id);
      
      // 2. Se vier pouco, buscar recentes como fallback
      if (filtered.length < 4) {
        console.debug('DETAIL_RELATED_FALLBACK: Poucos anúncios na categoria, buscando recentes');
        const recentResult = await fetchAds({ pageSize: 12 });
        const recentAds = (recentResult.ads || []).filter(a => a.id !== ad.id && !filtered.find(f => f.id === a.id));
        filtered = [...filtered, ...recentAds].slice(0, 8);
        console.debug('DETAIL_RELATED_SUCCESS', { count: filtered.length, type: 'fallback' });
      } else {
        filtered = filtered.slice(0, 8);
        console.debug('DETAIL_RELATED_SUCCESS', { count: filtered.length, type: 'category' });
      }
      
      setRelatedAds(filtered);
    } catch (error) {
      console.error('DETAIL_RELATED_ERROR', error);
      // Se falhar a busca por categoria, tenta pelo menos os recentes de forma genérica
      try {
        const fallbackResult = await fetchAds({ pageSize: 8 });
        setRelatedAds((fallbackResult.ads || []).filter(a => a.id !== ad.id));
      } catch (e2) {
        setRelatedAds([]);
      }
    } finally {
      setRelatedLoading(false);
    }
  };

  const loadAd = async (adId: string) => {
    if (loadingDetailRef.current && currentAdIdRef.current === adId) {
      console.debug("DETAIL_LOAD_SKIPPED_ALREADY_LOADING", { adId });
      return;
    }

    loadingDetailRef.current = true;
    currentAdIdRef.current = adId;

    try {
      setLoading(true);
      setNotFound(false);
      
      // Resetar ad apenas se trocou de ID, mantendo estado caso role re-render de auth/favoritos
      if (loadedAdIdRef.current !== adId) {
        setAd(null);
      }

      const data = await fetchAdById(adId);
      
      if (currentAdIdRef.current !== adId) {
        console.debug("DETAIL_LOAD_STALE_IGNORED", { adId, currentAdId: currentAdIdRef.current });
        return;
      }
      
      if (data) {
        setAd(data);
        setNotFound(false);
        loadedAdIdRef.current = adId;

        // Record view if not already counted in this session
        try {
          const sessionKey = `viewed_ad_${adId}`;
          const alreadyViewed = sessionStorage.getItem(sessionKey);

          if (!alreadyViewed) {
            sessionStorage.setItem(sessionKey, 'true');
            const viewsToUse = data.views_count ?? data.views ?? 0;
            incrementAdViewsCount(adId, viewsToUse).then(newViews => {
              setAd(prev => {
                if (prev && prev.id === adId) {
                  return {
                    ...prev,
                    views_count: newViews,
                    views: newViews
                  };
                }
                return prev;
              });
            }).catch(e => console.debug('View counting error ignored', e));
          }
        } catch (viewError) {
          console.debug('View counting setup error ignored', viewError);
        }
      } else {
        setAd(null);
        setNotFound(true);
        loadedAdIdRef.current = adId;
        console.log("DETAIL_LOAD_NOT_FOUND", { adId });
      }
    } catch (err: any) {
      if (
        err?.name === 'AbortError' || 
        err?.message?.includes('AbortError') || 
        err?.message?.includes('signal is aborted')
      ) {
        console.debug("DETAIL_LOAD_ABORTED_IGNORED", { adId });
        return;
      }
      if (isNonCriticalSupabaseError(err)) return;
      console.error('DETAIL_LOAD_ERROR', err);
      setAd(null);
      setNotFound(true);
    } finally {
      if (currentAdIdRef.current === adId) {
        loadingDetailRef.current = false;
        setLoading(false);
      } else {
        console.debug("DETAIL_LOAD_FINISHED_STALE", { adId, currentAdId: currentAdIdRef.current });
      }
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
      checkIsFavorited(user.id, ad.id).then(setIsFavorited);
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-100 rounded w-20"></div>
        <div className="h-10 bg-gray-100 rounded-full w-24"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-gray-100 rounded-xl aspect-[4/3]"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="aspect-square bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
            <div className="flex gap-2">
              <div className="h-6 bg-gray-100 rounded w-16"></div>
              <div className="h-6 bg-gray-100 rounded w-16"></div>
            </div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-50 rounded w-1/2"></div>
            <div className="h-12 bg-gray-100 rounded w-2/3"></div>
            <div className="h-40 bg-gray-50 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Anúncio não encontrado</h2>
      <Link to="/" className="text-emerald-600 font-bold hover:underline">Voltar para o início</Link>
    </div>
  );

  if (!ad) return null;

  // Guards defensivos para evitar crash de renderização
  const profileData = Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles;

  const views_count = ad.views_count ?? ad.views ?? 0;
  const whatsapp_clicks_count = ad.whatsapp_clicks_count ?? ad.interests ?? 0;
  const shares_count = ad.shares_count ?? 0;

  const isCreatedRecently = () => {
    if (!ad?.created_at) return false;
    const createdAtDate = new Date(ad.created_at);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - createdAtDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };
  
  // Lógica para decidir nome e telefone do vendedor (preferência para dados externos)
  const sellerName = ad.is_external ? (ad.external_seller_name || 'Anunciante Externo') : (profileData?.name || 'Vendedor Anônimo');
  const whatsappNumber = ad.is_external ? ad.external_seller_phone : profileData?.whatsapp;
  
  if (images.length === 0) {
    images.push({ 
      id: 'placeholder', 
      ad_id: ad?.id || '', 
      image_url: FALLBACK_IMAGE,
      is_primary: true,
      sort_order: 0
    });
  }

  const shareAd = async () => {
    try {
      if (ad) {
        incrementAdShares(ad.id, ad.shares_count || 0).then(newShares => {
          setAd(prev => {
            if (prev && prev.id === ad.id) {
              return {
                ...prev,
                shares_count: newShares
              };
            }
            return prev;
          });
        }).catch(e => console.debug('Shares count error ignored', e));
      }

      if (navigator.share) {
        await navigator.share({
          title: ad.title || 'Anúncio no Tefé Market',
          text: `Olha esse anuncio no Tefe Market: ${ad.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      // Silently catch or log only meaningful error
      console.error('Falha ao compartilhar:', err);
    }
  };

  // Normalização do WhatsApp para link wa.me
  const shareOnWhatsApp = async () => {
    try {
      incrementAdShares(ad.id, ad.shares_count || 0).then(newShares => {
        setAd(prev => {
          if (prev && prev.id === ad.id) {
            return {
              ...prev,
              shares_count: newShares
            };
          }
          return prev;
        });
      }).catch(e => console.debug('Shares count error ignored', e));

      const message = `Olha esse anuncio no Tefe Market:\n\n${ad.title}\n${formatAdPrice(ad.price || 0, ad.ad_type)}\n\n${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Falha ao compartilhar no WhatsApp:', err);
    }
  };

  const getWhatsAppUrl = () => {
    if (!whatsappNumber) return null;
    
    // Limpar o número para conter apenas dígitos
    let cleanNumber = whatsappNumber.replace(/\D/g, '');
    
    // Adicionar prefixo 55 se não houver país
    if (cleanNumber.length <= 11) {
      cleanNumber = `55${cleanNumber}`;
    }
    
    const message = `Olá! Vi seu anúncio no Tefé Market:

📦 ${ad.title}
💰 ${formatAdPrice(ad.price || 0, ad.ad_type)}

Ainda está disponível?`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const whatsappUrl = getWhatsAppUrl();

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
          <div className="relative bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 group aspect-[4/3] w-full">
            <motion.img 
              key={selectedImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={images[selectedImageIndex].image_url} 
              alt={ad.title} 
              className="w-full h-full object-cover transition-all duration-300"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, ad.title)}
            />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-800 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-800 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
                
                {/* Image Counter Overlay */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImageIndex(i)}
                  className={cn(
                    "rounded-xl overflow-hidden shadow-sm aspect-square bg-white border-2 transition-all active:scale-95",
                    selectedImageIndex === i ? "border-primary ring-2 ring-primary/20 scale-105 z-10" : "border-gray-100 hover:border-gray-300"
                  )}
                >
                  <img 
                    src={img.image_url} 
                    alt={`${ad.title} - ${i + 1}`} 
                    className={cn(
                      "w-full h-full object-cover transition-opacity",
                      selectedImageIndex === i ? "opacity-100" : "opacity-60 hover:opacity-100"
                    )}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, `${ad.title} (thumbnail)`)}
                  />
                </button>
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
                ad.ad_type === 'sale' ? "bg-primary text-white" : ad.ad_type === 'rent' ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
              )}>
                {ad.ad_type === 'sale' ? 'Venda' : ad.ad_type === 'rent' ? 'Aluguel' : 'Serviços'}
              </span>
              {ad.ad_type !== 'service' && (
                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded bg-gray-100 text-gray-600">
                  {ad.condition === 'new' ? 'Novo' : 'Usado'}
                </span>
              )}
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded bg-secondary/10 text-secondary flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                {ad.category}
              </span>
              {ad.is_verified && (
                <span 
                  title="Anúncio verificado pela nossa moderação: as informações e o anunciante foram auditados para sua segurança e confiança."
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] rounded bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm cursor-help"
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Anúncio Verificado
                </span>
              )}
            </div>

            {/* Badges de Prova Social baseados em movimentação */}
            {(views_count > 30 || whatsapp_clicks_count > 5 || isCreatedRecently()) && (
              <div className="flex flex-wrap gap-1.5 mb-4 select-none">
                {views_count > 30 && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                    🔥 Anúncio em alta
                  </span>
                )}
                {whatsapp_clicks_count > 5 && (
                  <span className="flex items-center gap-1 bg-green-50 text-green-800 border border-green-200/60 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                    💬 Muito Interessado
                  </span>
                )}
                {isCreatedRecently() && (
                  <span className="flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200/60 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                    ⚡ Novo
                  </span>
                )}
              </div>
            )}

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

            <div className="text-3xl font-black text-primary mb-5">
              {formatAdPrice(ad.price || 0, ad.ad_type)}
            </div>

            {/* Prova Social de Contagem Real com design moderno e discreto */}
            <div className="bg-emerald-50/55 border border-emerald-100/70 rounded-xl p-3.5 mb-6 space-y-2 select-none">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold leading-none">
                <span className="text-sm">👀</span>
                <span>
                  <strong className="font-extrabold text-emerald-950">{views_count}</strong> {views_count === 1 ? 'pessoa visualizou' : 'pessoas visualizaram'} este anúncio
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold leading-none">
                <span className="text-sm">💬</span>
                <span>
                  <strong className="font-extrabold text-emerald-950">{whatsapp_clicks_count}</strong> {whatsapp_clicks_count === 1 ? 'pessoa chamou' : 'pessoas chamaram'} o vendedor
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold leading-none">
                <span className="text-sm">🔗</span>
                <span>
                  Compartilhado <strong className="font-extrabold text-emerald-950">{shares_count}</strong> {shares_count === 1 ? 'vez' : 'vezes'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Chat interno desativado temporariamente para o MVP
              <button 
                onClick={handleStartChat}
                className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 text-sm uppercase tracking-wider"
              >
                <MessageSquare className="w-5 h-5" />
                Chat no Tefé Market
              </button>
              */}
              
              {whatsappUrl && (
                <button 
                  onClick={() => {
                    if (ad) {
                      incrementAdWhatsAppClicks(ad.id, ad.whatsapp_clicks_count || ad.interests || 0).then(newClicks => {
                        setAd(prev => {
                          if (prev && prev.id === ad.id) {
                            return {
                              ...prev,
                              whatsapp_clicks_count: newClicks,
                              interests: newClicks
                            };
                          }
                          return prev;
                        });
                      }).catch(e => console.debug('WhatsApp click count error ignored', e));
                      window.location.href = whatsappUrl;
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[#25D366]/20 border-b-4 border-[#128C7E] text-sm uppercase tracking-wider cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                </button>
              )}
              
              <button 
                onClick={shareAd}
                className="flex items-center justify-center gap-2 bg-white text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-all active:scale-95 border-2 border-gray-100 text-xs uppercase tracking-widest"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar Oferta
              </button>

              <button 
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-bold py-3 rounded-lg hover:bg-emerald-100 transition-all active:scale-95 border-2 border-emerald-100 text-xs uppercase tracking-widest"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar pelo WhatsApp
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
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-primary/10 flex items-center justify-center overflow-hidden">
              {profileData?.avatar_url ? (
                <img src={profileData.avatar_url} alt={sellerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">Anunciante</p>
              <h3 className="text-md font-bold text-gray-900">{sellerName}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Anúncios Relacionados */}
      <div className="mt-16 sm:mt-24 border-t border-gray-100 pt-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              Anúncios Relacionados
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">
              Você também pode gostar
            </p>
          </div>
        </div>

        {relatedLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="aspect-[4/6] bg-gray-50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : relatedAds.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
            {relatedAds.map(relatedAd => (
              <AdCard key={relatedAd.id} ad={relatedAd} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
            <p className="text-gray-400 text-sm font-medium">Nenhum anúncio relacionado encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
