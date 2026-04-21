import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAds } from '../services/ads';
import { Ad, AdFilter } from '../types';
import AdCard from '../components/AdCard';
import { 
  Search, 
  PackageOpen, 
  Smartphone, 
  Bike, 
  Home as HomeIcon, 
  Wrench, 
  Box, 
  Zap,
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';

const VISUAL_CATEGORIES = [
  { name: 'Eletrônicos', icon: Smartphone, color: 'bg-blue-500' },
  { name: 'Veículos', icon: Bike, color: 'bg-orange-500' },
  { name: 'Imóveis', icon: HomeIcon, color: 'bg-emerald-500' },
  { name: 'Serviços', icon: Wrench, color: 'bg-purple-500' },
  { name: 'Outros', icon: Box, color: 'bg-gray-500' },
];

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdFilter>({
    search: '',
    category: 'Todos',
    type: 'all',
    condition: 'all'
  });

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await fetchAds(filters);
      setAds(data);
    } catch (err) {
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAds();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search, filters.category, filters.type]);

  const featuredAds = ads.slice(0, 2);
  const recentAds = ads.slice(2);

  return (
    <div className="flex flex-col min-h-screen bg-bg-main">
      {/* Header Section (Compact Funnel) */}
      <div className="bg-primary pt-6 pb-12 px-6 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-6xl font-black text-white mb-1 uppercase tracking-tighter leading-[0.9]">
              COMPRE, VENDA <br/>
              <span className="text-secondary italic">OU ALUGUE</span> EM TEFÉ
            </h1>
            <p className="hidden sm:block text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
              O maior marketplace local da cidade
            </p>
          </motion.div>
          
          {/* Improved Search Bar (More Compact) */}
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-1 border-2 border-transparent">
              <Search className="absolute left-4 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="O que você procura hoje?" 
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-base text-gray-900 bg-transparent outline-none placeholder:text-gray-400 font-bold tracking-tight"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full -mt-8 px-4 relative z-20 space-y-6 pb-24">
        {/* Visual Categories (More Compact) */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-lg border border-white p-3">
          <div className="flex overflow-x-auto no-scrollbar gap-3 py-1">
            <button
              onClick={() => setFilters({ ...filters, category: 'Todos' })}
              className={cn(
                "flex flex-col items-center gap-1.5 flex-shrink-0 group transition-all",
                filters.category === 'Todos' ? "opacity-100" : "opacity-60 hover:opacity-100"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                filters.category === 'Todos' ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" : "bg-gray-100 text-gray-400 group-hover:scale-105"
              )}>
                <Box className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">Todos</span>
            </button>

            {VISUAL_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setFilters({ ...filters, category: cat.name })}
                className={cn(
                  "flex flex-col items-center gap-1.5 flex-shrink-0 group transition-all",
                  filters.category === cat.name ? "opacity-100" : "opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  filters.category === cat.name ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" : "bg-gray-100 text-gray-400 group-hover:scale-105"
                )}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section (More Compact) */}
        <AnimatePresence>
          {!loading && filters.category === 'Todos' && !filters.search && featuredAds.length > 0 && (
            <>
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 px-1">
                  <Zap className="w-4 h-4 text-secondary fill-secondary" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-900">
                    🔥 Destaques
                  </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {featuredAds.map(ad => (
                    <AdCard key={ad.id} ad={ad} featured />
                  ))}
                </div>
              </motion.section>

              {/* Map Exploration Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <MapPin className="w-32 h-32 text-primary" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-primary uppercase tracking-tighter mb-2">Explore Tefé pelo Mapa!</h3>
                  <p className="text-gray-500 text-xs font-medium mb-6 max-w-sm mx-auto">
                    Encontre anúncios pertinho de você navegando pelos bairros da nossa cidade.
                  </p>
                  <Link to="/mapa">
                    <Button className="rounded-full px-8 py-3 shadow-xl shadow-primary/20">
                      Ver Mapa Interativo
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Feed Section (More Compact) */}
        <main className="space-y-4" id="ads-grid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 border-l-2 border-primary pl-2">
              {filters.category !== 'Todos' ? `${filters.category}` : 'Recentes'}
              <span className="ml-2 text-primary/40 font-bold">/ {ads.length}</span>
            </div>
            
            {/* Filter Pills (More Compact) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['all', 'sale', 'rent'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters({ ...filters, type: t as any })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[7px] font-black uppercase tracking-widest transition-all",
                    filters.type === t ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
                  )}
                >
                  {t === 'all' ? 'Ver Tudo' : t === 'sale' ? 'Venda' : 'Aluguel'}
                </button>
              ))}
            </div>
          </div>

          <div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white rounded-2xl aspect-[4/5] animate-pulse border border-gray-100 shadow-sm overflow-hidden">
                    <div className="w-full h-[55%] bg-gray-50"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-50 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-50 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                {recentAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="bg-gray-50 p-10 rounded-full mb-6 relative">
                  <PackageOpen className="w-12 h-12 text-gray-200" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-[10px] font-bold">?</div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Nenhum resultado</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-medium">
                  Tente ajustar os filtros ou pesquisar por outro termo.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ ...filters, search: '', category: 'Todos', type: 'all' })}
                  className="rounded-2xl px-8 border-2"
                >
                  Limpar tudo
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
