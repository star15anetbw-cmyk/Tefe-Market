import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ad } from '../types';
import { formatPrice, formatAdPrice, cn, getAdCoverImage, handleImageError } from '../lib/utils';
import { FALLBACK_IMAGE } from '../constants';
import { MapPin, Clock, Heart, Eye, BadgeCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { checkIsFavorited, toggleFavorite } from '../services/favorites';

interface AdCardProps {
  ad: Ad;
  featured?: boolean;
  key?: React.Key;
}

export default function AdCard({ ad, featured = false }: AdCardProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  // Usar helper seguro para imagem de capa
  const coverImage = getAdCoverImage(ad.ad_images) || FALLBACK_IMAGE;
  const profileData = Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles;
  const sellerName = ad.is_external ? (ad.external_seller_name || 'Anunciante') : (profileData?.name || 'Profissional');

  useEffect(() => {
    if (user) {
      checkIsFavorited(user.id, ad.id).then(setIsFavorited);
    }
  }, [user, ad.id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || isToggling) return;

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        scale: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className={cn(
        "bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 flex flex-col group transition-all h-full"
      )}
    >
      <Link to={`/anuncio/${ad.id}`} className="block relative group-hover:no-underline flex flex-col h-full">
        <div className="relative overflow-hidden bg-gray-100 aspect-square sm:aspect-[4/3] w-full">
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={coverImage} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, ad.title)}
          />
          
          {/* Badge overlays */}
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-col gap-0.5 sm:gap-1 z-10">
            <span className={cn(
              "px-1.5 sm:px-2 py-0.5 text-[7px] sm:text-[8px] font-black uppercase tracking-wider rounded-md text-white shadow-sm backdrop-blur-md",
              ad.ad_type === 'sale' ? "bg-primary/90" : ad.ad_type === 'rent' ? "bg-blue-600/90" : "bg-purple-600/90"
            )}>
              {ad.ad_type === 'sale' ? 'Venda' : ad.ad_type === 'rent' ? 'Aluguel' : 'Serviços'}
            </span>
            {ad.is_verified && (
              <span 
                title="Este anúncio foi verificado pela nossa equipe para garantir maior segurança e autenticidade das informações."
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[7px] sm:text-[8px] font-black uppercase tracking-wider rounded-md text-white shadow-sm backdrop-blur-md bg-emerald-500/90 cursor-help"
              >
                <BadgeCheck className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                Verificado
              </span>
            )}
          </div>
          
          <button 
            onClick={handleToggleFavorite}
            className={cn(
              "absolute top-1 sm:top-2 right-1 sm:right-2 p-1 sm:p-1.5 backdrop-blur-md rounded-full transition-all shadow-sm z-10",
              isFavorited 
                ? "bg-red-500 text-white" 
                : "bg-white/70 text-gray-400 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-3 sm:w-3.5 h-3 sm:h-3.5", isFavorited && "fill-current")} />
          </button>
        </div>

        <div className="p-2 sm:p-3 flex flex-col flex-1">
          <h3 className="font-medium text-[11px] sm:text-xs text-gray-700 line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors min-h-[1.75rem] sm:min-h-[2rem]">
            {ad.title}
          </h3>

          {ad.ad_type === 'service' && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profileData?.avatar_url ? (
                  <img src={profileData.avatar_url} alt={sellerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-[8px] font-bold text-primary uppercase">{sellerName.charAt(0)}</div>
                )}
              </div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">
                {sellerName}
              </span>
            </div>
          )}

          <div className="mt-auto pt-0.5 sm:pt-1">
            <div className="font-bold text-sm sm:text-lg text-gray-900 leading-none mb-1 sm:mb-2 tracking-tight">
              {formatAdPrice(ad.price, ad.ad_type)}
            </div>
            
            <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-gray-400 font-medium border-t border-gray-50 pt-1.5 sm:pt-2">
              <div className="flex items-center truncate max-w-[65%]">
                <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-0.5 sm:mr-1 text-gray-300 flex-shrink-0" />
                <span className="truncate">{ad.neighborhood}</span>
              </div>
              <div className="flex items-center whitespace-nowrap text-[7px] sm:text-[9px]">
                {new Date(ad.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
