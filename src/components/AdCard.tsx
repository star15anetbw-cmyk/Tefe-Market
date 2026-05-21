import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ad } from '../types';
import { formatPrice, formatAdPrice, cn, getAdCoverImage, handleImageError } from '../lib/utils';
import { FALLBACK_IMAGE } from '../constants';
import { MapPin, Clock, Heart, Eye, BadgeCheck, Star } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border flex flex-col group transition-all h-full",
        (featured || ad.is_featured) ? "border-amber-200 ring-2 ring-amber-100" : "border-gray-100"
      )}
    >
      <Link to={`/anuncio/${ad.id}`} className="block relative group-hover:no-underline flex flex-col h-full">
        <div className="relative overflow-hidden bg-gray-50 aspect-[4/3] sm:aspect-[4/3] w-full">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            src={coverImage} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, ad.title)}
          />
          
          {/* Heart Button */}
          <button 
            onClick={handleToggleFavorite}
            className={cn(
              "absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2.5 backdrop-blur-md rounded-xl sm:rounded-2xl transition-all shadow-lg z-20 active:scale-90",
              isFavorited 
                ? "bg-red-500 text-white" 
                : "bg-white/80 text-gray-400 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isFavorited && "fill-current")} />
          </button>

          {/* Type Badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-wrap gap-1.5">
            {(featured || ad.is_featured) && (
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl text-white shadow-lg bg-amber-500 border border-white/20 inline-flex items-center gap-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" /> Destaque
              </span>
            )}
            <span className={cn(
              "px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl text-white shadow-lg backdrop-blur-md border border-white/20",
              ad.ad_type === 'sale' ? "bg-primary/90" : ad.ad_type === 'rent' ? "bg-blue-600/90" : "bg-purple-600/90"
            )}>
              {ad.ad_type === 'sale' ? 'Venda' : ad.ad_type === 'rent' ? 'Aluguel' : 'Serviço'}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             {ad.is_verified && (
               <div className="flex items-center gap-1 text-white text-[8px] sm:text-[10px] font-bold">
                 <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                 Verificado
               </div>
             )}
          </div>
        </div>

        <div className="p-2.5 sm:p-5 flex flex-col flex-1">
          <h3 className="font-bold sm:font-extrabold text-[10px] sm:text-sm text-gray-900 line-clamp-2 leading-tight mb-1 sm:mb-2 group-hover:text-primary transition-colors min-h-[1.75rem] sm:min-h-[2.75rem]">
            {ad.title}
          </h3>

          <div className="flex items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4 text-gray-400">
             <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
               <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
               <span className="truncate max-w-[80px] sm:max-w-none">{ad.neighborhood}</span>
             </div>
          </div>

          <div className="mt-auto pt-1.5 sm:pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="font-black text-xs sm:text-xl text-primary tracking-tight">
              {formatAdPrice(ad.price, ad.ad_type)}
            </div>
            {ad.is_featured && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
