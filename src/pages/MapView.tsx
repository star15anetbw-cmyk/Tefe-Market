import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchAds } from '../services/ads';
import { Ad, AdFilter, AdType } from '../types';
import { CATEGORIES, NEIGHBORHOODS, FILTER_NEIGHBORHOODS } from '../constants';
import { TEFE_CENTER, getRandomCoordInNeighborhood } from '../constants/locations';
import { Search as SearchIcon, Filter, LayoutGrid, MapPin, Tag, ChevronRight } from 'lucide-react';
import {Link} from 'react-router-dom';
import { cn, formatPrice } from '../lib/utils';
import Button from '../components/ui/Button';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for seller locations or specific categories
const CustomMarkerIcon = (type: AdType) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${type === 'sale' ? '#064e3b' : type === 'rent' ? '#2563eb' : '#9333ea'}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export default function MapView() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdFilter>({
    search: '',
    neighborhood: 'Todos os bairros',
    category: 'Todos',
    type: 'all',
    condition: 'all'
  });

  const loadAds = async () => {
    setLoading(true);
    try {
      const result = await fetchAds(filters);
      // Ensure everyone has coordinates
      const adsWithCoords = result.ads.map(ad => {
        if (!ad.lat || !ad.lng) {
          const [lat, lng] = getRandomCoordInNeighborhood(ad.neighborhood);
          return { ...ad, lat, lng };
        }
        return ad;
      });
      setAds(adsWithCoords);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [filters]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px-64px)] lg:h-[calc(100vh-64px)] overflow-hidden">
      {/* Search & Filter Header (Mirrored from Search.tsx) */}
      <div className="bg-white shadow-sm border-b border-gray-100 z-20">
        <div className="max-w-4xl mx-auto p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Explorar mapa de Tefé..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none transition-all"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-lg border transition-all",
                showFilters ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
            <Link to="/buscar" className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <LayoutGrid className="w-5 h-5" />
            </Link>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[30vh]">
              <section>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoria</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['Todos', ...CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilters({ ...filters, category: cat })}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border",
                        filters.category === cat 
                          ? "bg-primary text-white border-primary" 
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Bairro</h3>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold focus:border-primary outline-none appearance-none transition-all"
                    value={filters.neighborhood}
                    onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                  >
                    {FILTER_NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <section>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Tipo</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                    {['all', 'sale', 'rent', 'service'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilters({ ...filters, type: type as any })}
                        className={cn(
                          "flex-1 py-1 px-2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                          filters.type === type ? "bg-white text-primary shadow-sm" : "text-gray-400"
                        )}
                      >
                        {type === 'all' ? 'Tudo' : type === 'sale' ? 'Venda' : type === 'rent' ? 'Aluguel' : 'Serviços'}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Condição</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'new', 'used'].map(cond => (
                      <button
                        key={cond}
                        onClick={() => setFilters({ ...filters, condition: cond as any })}
                        className={cn(
                          "flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                          filters.condition === cond ? "bg-white text-primary shadow-sm" : "text-gray-400"
                        )}
                      >
                        {cond === 'all' ? 'Tudo' : cond === 'new' ? 'Novo' : 'Usado'}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative z-10">
        {loading && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100">
               <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
               <span className="text-xs font-black uppercase tracking-widest text-gray-900">Mapeando...</span>
            </div>
          </div>
        )}

        <MapContainer 
          center={TEFE_CENTER} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {ads.map(ad => (
            <Marker 
              key={ad.id} 
              position={[ad.lat!, ad.lng!]}
              icon={CustomMarkerIcon(ad.ad_type)}
            >
              <Popup className="ad-popup" minWidth={180}>
                <div className="p-0 overflow-hidden">
                  <Link to={`/anuncio/${ad.id}`} className="block group">
                     {ad.ad_images && ad.ad_images[0] && (
                        <div className="aspect-video w-full rounded-t-lg overflow-hidden -mt-1 -mx-3 mb-2">
                           <img 
                            src={ad.ad_images[0].image_url} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                            alt=""
                           />
                        </div>
                     )}
                     <div className="flex flex-col gap-1">
                        <div className="text-sm font-black text-primary leading-tight">
                           {formatPrice(ad.price)}
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-900 truncate uppercase mt-0.5">
                           {ad.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
                           <MapPin className="w-2.5 h-2.5" />
                           {ad.neighborhood}
                        </div>
                        <div className="mt-2 text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Ver mais <ChevronRight className="w-3 h-3" />
                        </div>
                     </div>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
