import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ad } from '../types';
import { formatPrice, cn } from '../lib/utils';
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

  // Encontrar a imagem principal ou usar a primeira disponível
  const mainImage = ad.ad_images?.find(img => img.is_primary)?.image_url || 
                    ad.ad_images?.[0]?.image_url || 
                    fallbackImage;

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
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ 
        duration: 0.5,
        scale: { type: "spring", stiffness: 300, damping: 15 }
      }}
      className={cn(
        "bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 flex flex-col group transition-all h-full"
      )}
    >
      <Link to={`/anuncio/${ad.id}`} className="block relative group-hover:no-underline">
        <div className={cn(
          "relative overflow-hidden bg-gray-50",
          featured ? "aspect-[16/9]" : "aspect-[4/5]"
        )}>
          <img 
            src={mainImage} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
          
          {/* Overlay Actions & Badges */}
          <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10">
            <div className="flex flex-col gap-1.5">
              <span className={cn(
                "px-2.5 py-1 text-[7px] font-black uppercase tracking-widest rounded-lg text-white shadow-lg backdrop-blur-md",
                ad.ad_type === 'sale' ? "bg-primary/90" : "bg-blue-600/90"
              )}>
                {ad.ad_type === 'sale' ? 'Venda' : 'Aluguel'}
              </span>
              {ad.condition === 'new' && (
                <span className="px-2.5 py-1 text-[7px] font-black uppercase tracking-widest rounded-lg bg-accent/90 text-gray-900 shadow-lg backdrop-blur-md">
                  Novo
                </span>
              )}
            </div>
            
            <button 
              onClick={handleToggleFavorite}
              className={cn(
                "p-2 backdrop-blur-md rounded-full transition-all border",
                isFavorited 
                  ? "bg-red-500 text-white border-red-400" 
                  : "bg-white/20 text-white hover:bg-white hover:text-red-500 border-white/30"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
            </button>
          </div>

          {/* Bottom Stats Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-end">
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-white/90 uppercase tracking-tight">
              <Eye className="w-3 h-3" />
              <span>{ad.views || Math.floor(Math.random() * 50)} vus</span>
            </div>
            {ad.interests && ad.interests > 5 && (
              <div className="px-2 py-0.5 bg-secondary text-white text-[7px] font-black uppercase tracking-widest rounded-md animate-pulse">
                {ad.interests} interessados
              </div>
            )}
          </div>
        </div>

        <div className="p-3 flex flex-col">
          <div className={cn(
            "font-black text-gray-900 leading-none tracking-tighter mb-1",
            featured ? "text-xl" : "text-lg"
          )}>
            {formatPrice(ad.price)}
          </div>
          
          <h3 className="font-bold text-[9px] text-gray-500 line-clamp-1 leading-tight mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">
            {ad.title}
          </h3>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[7px] text-gray-400 font-black uppercase tracking-widest">
            <div className="flex items-center truncate">
              <MapPin className="w-2.5 h-2.5 mr-1 text-primary/30" />
              <span className="truncate">{ad.neighborhood}</span>
            </div>
            <div className="flex items-center whitespace-nowrap ml-2">
              <Clock className="w-2.5 h-2.5 mr-1 text-gray-300" />
              {new Date(ad.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
