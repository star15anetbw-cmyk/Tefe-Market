import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ad } from '../types';
import { formatPrice, formatAdPrice, cn, getAdCoverImage } from '../lib/utils';
import { MapPin, Clock, Heart, Eye } from 'lucide-react';
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
  
  // Fallback visual para imagens ausentes
  const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23F9FAFB'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' font-weight='bold' fill='%23D1D5DB' text-anchor='middle' dy='.3em'%3ESEM IMAGEM%3C/text%3E%3C/svg%3E";

  // Usar helper seguro para imagem de capa
  const coverImage = getAdCoverImage(ad.ad_images) || fallbackImage;

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
        <div className={cn(
          "relative overflow-hidden bg-gray-100",
          featured ? "aspect-[16/9]" : "aspect-[4/3]"
        )}>
          <img 
            src={coverImage} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
          
          {/* Badge overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span className={cn(
              "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md text-white shadow-sm backdrop-blur-md",
              ad.ad_type === 'sale' ? "bg-primary/90" : ad.ad_type === 'rent' ? "bg-blue-600/90" : "bg-purple-600/90"
            )}>
              {ad.ad_type === 'sale' ? 'Venda' : ad.ad_type === 'rent' ? 'Aluguel' : 'Serviços'}
            </span>
          </div>
          
          <button 
            onClick={handleToggleFavorite}
            className={cn(
              "absolute top-2 right-2 p-1.5 backdrop-blur-md rounded-full transition-all shadow-sm z-10",
              isFavorited 
                ? "bg-red-500 text-white" 
                : "bg-white/70 text-gray-400 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
          </button>
        </div>

        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-medium text-xs text-gray-700 line-clamp-2 leading-snug mb-1 group-hover:text-primary transition-colors min-h-[2rem]">
            {ad.title}
          </h3>

          <div className="mt-auto pt-1">
            <div className="font-bold text-lg text-gray-900 leading-tight mb-2 tracking-tight">
              {formatAdPrice(ad.price, ad.ad_type)}
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium border-t border-gray-50 pt-2">
              <div className="flex items-center truncate max-w-[65%]">
                <MapPin className="w-3 h-3 mr-1 text-gray-300 flex-shrink-0" />
                <span className="truncate">{ad.neighborhood}</span>
              </div>
              <div className="flex items-center whitespace-nowrap text-[9px]">
                {new Date(ad.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
