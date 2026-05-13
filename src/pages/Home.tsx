import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  User
} from 'lucide-react';
import { cn, isNonCriticalSupabaseError } from '../lib/utils';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y, Mousewheel, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';

const VISUAL_CATEGORIES = [
  { name: 'Eletrônicos', icon: Smartphone, color: 'bg-blue-500' },
  { name: 'Veículos', icon: Bike, color: 'bg-orange-500' },
  { name: 'Imóveis', icon: HomeIcon, color: 'bg-emerald-500' },
  { name: 'Serviços', icon: Wrench, color: 'bg-purple-500' },
  { name: 'Outros', icon: Box, color: 'bg-gray-500' },
];

const SORT_OPTIONS = [
  { label: 'Mais Recentes', value: 'recent' },
  { label: 'Menor Preço', value: 'price_asc' },
  { label: 'Maior Preço', value: 'price_desc' },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const requestRef = useRef(0);
  
  const [localSearch, setLocalSearch] = useState('');
  const [filters, setFilters] = useState<AdFilter>({
    search: '',
    category: 'Todos',
    type: 'all',
    condition: 'all',
    sortBy: 'recent'
  });

  // Watch for long loading states
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
    } else {
      setLoadingTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Debounce search input to avoid many re-renders/fetches if search becomes live
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        if (prev.search === localSearch) return prev;
        return { ...prev, search: localSearch };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const abortControllerRef = useRef<AbortController | null>(null);
  
  const loadAds = useCallback(async (isInitial = true, overrideFilters?: AdFilter) => {
    const requestId = ++requestRef.current;
    
    // Evita múltiplas chamadas simultâneas para carregar mais
    if (!isInitial && (loading || loadingMore)) return;

    // Cancelar requisição anterior se for uma nova busca inicial
    if (isInitial && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    if (isInitial) {
      abortControllerRef.current = controller;
      setLoading(true);
      setError(null);
      setPage(0);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const targetPage = isInitial ? 0 : page + 1;
      const activeFilters = overrideFilters || filters;
      
      const result = await fetchAds({ 
        ...activeFilters, 
        page: targetPage, 
        pageSize: 12 
      }, controller.signal);
      
      // Proteção contra Race Condition: se uma nova busca começou, ignoramos esta resposta
      if (requestId !== requestRef.current) return;
      
      if (isInitial) {
        setAds(Array.isArray(result.ads) ? result.ads : []);
      } else {
        setAds(prev => [...prev, ...(Array.isArray(result.ads) ? result.ads : [])]);
        setPage(targetPage);
      }
      
      setTotalCount(result.totalCount || 0);
      setHasMore(result.hasMore || false);
    } catch (err: any) {
      if (requestId !== requestRef.current) return;
      if (err.name === 'AbortError') return;
      
      if (isNonCriticalSupabaseError(err)) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setError(err.message || 'Não foi possível carregar os anúncios.');
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [
    filters.category, 
    filters.type, 
    filters.sortBy, 
    filters.condition, 
    filters.search, 
    page
  ]);

  const resetHomeFilters = useCallback(() => {
    const defaultFilters: AdFilter = {
      search: '',
      category: 'Todos',
      type: 'all',
      condition: 'all',
      sortBy: 'recent'
    };

    setFilters(defaultFilters);
    setLocalSearch('');
    setPage(0);
    // O useEffect já irá disparar o loadAds ao detectar a mudança nos filtros

    if (location.search) {
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  // Reset logic when navigation state triggers it
  useEffect(() => {
    const locState = location.state as { resetHome?: number } | null;
    if (locState?.resetHome) {
      resetHomeFilters();
      // Clear state after reset to avoid repeated triggers
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, resetHomeFilters, navigate]);

  useEffect(() => {
    // Only fetch if we are not already loading something initial
    loadAds(true);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters.category, filters.type, filters.sortBy, filters.condition]); // Removed search from dependencies to avoid loop during typing

  // Redireciona para a página de busca ao submeter
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchTerm = localSearch.trim();
    if (searchTerm) {
      navigate(`/buscar?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Lógica de separação: Destaques vs Lista Principal
  // A Home não mostra resultados de busca textual, apenas filtros globais
  const isDefaultView = filters.category === 'Todos' && page === 0 && filters.sortBy === 'recent';
  
  const featuredAds = isDefaultView ? ads.slice(0, 6) : [];
  const mainAds = isDefaultView ? ads.slice(6) : ads;
  
  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-main">
      {/* Header Section (Branded) */}
      <div className="bg-primary pt-8 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary/10 via-transparent to-transparent opacity-40"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 uppercase tracking-tighter leading-tight">
              O QUE VOCÊ <br className="sm:hidden"/> 
              <span className="text-secondary">PROCURA</span> HOJE?
            </h1>
            <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em]">
              O marketplace oficial da cidade de Tefé
            </p>
          </motion.div>
          
          {/* Main Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-1 border border-gray-100">
              <Search className="absolute left-5 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Busque por produtos, serviços..." 
                className="w-full pl-14 pr-6 py-4 text-base sm:text-lg text-gray-900 bg-transparent outline-none placeholder:text-gray-300 font-medium"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <div className="hidden sm:flex items-center gap-2 pr-2">
                <Button 
                  type="submit"
                  className="rounded-xl px-8 py-3 h-auto text-[10px] uppercase tracking-widest font-black active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </form>

          {/* Simple Teaser Text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] font-medium text-white/50 mt-4 uppercase tracking-[0.2em]"
          >
            🔥 Lançamento em Tefé — Anuncie grátis
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full -mt-8 px-4 relative z-20 space-y-12 pb-32">
        {/* Categories Carousel */}
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-3">
            <Swiper
              modules={[Navigation, Pagination, Scrollbar, A11y, Mousewheel, FreeMode]}
              spaceBetween={8}
              slidesPerView="auto"
              freeMode={true}
              mousewheel={{ forceToAxis: true }}
              className="categories-swiper"
            >
              <SwiperSlide className="!w-auto">
                <button
                  onClick={() => {
                    if (filters.category === 'Todos') {
                      loadAds(true);
                    } else {
                      setFilters({ ...filters, category: 'Todos' });
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                    filters.category === 'Todos' ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  Todos
                </button>
              </SwiperSlide>

              {VISUAL_CATEGORIES.map((cat) => (
                <SwiperSlide key={cat.name} className="!w-auto">
                  <button
                    onClick={() => setFilters({ ...filters, category: cat.name })}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                      filters.category === cat.name ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

      {/* Featured Section */}
      <AnimatePresence>
        {featuredAds.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">
                  Oportunidades em Destaque
                </h2>
              </div>
            </div>
            <Swiper
              modules={[Navigation, A11y, Mousewheel, FreeMode]}
              spaceBetween={16}
              slidesPerView="auto"
              freeMode={true}
              mousewheel={{ forceToAxis: true }}
              className="featured-swiper !px-4 !-mx-4 pb-4"
            >
              {featuredAds.map(ad => (
                <SwiperSlide key={ad.id} className="min-w-[calc(55%-8px)] sm:min-w-[calc(25%-12px)] transition-transform active:scale-95 duration-200">
                  <AdCard ad={ad} />
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Feed Section */}
      <main className="space-y-8 relative z-30">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2 overflow-x-auto no-scrollbar lg:scrollbar-thin lg:scrollbar-thumb-gray-200 lg:scrollbar-track-transparent pb-1"
            onWheel={handleWheelScroll}
          >
            {['all', 'sale', 'rent', 'service'].map((t) => (
              <button
                key={t}
                onClick={() => setFilters({ ...filters, type: t as any })}
                className={cn(
                  "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                  filters.type === t ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                )}
              >
                {t === 'all' ? 'Ver Tudo' : t === 'sale' ? 'Venda' : t === 'rent' ? 'Aluguel' : 'Serviços'}
              </button>
            ))}
            <div className="h-6 w-[1px] bg-gray-200 mx-2 flex-shrink-0"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              {totalCount} anúncios em Tefé
            </span>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="relative flex items-center bg-white rounded-xl px-4 py-2 border border-gray-100 group">
              <select 
                className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none appearance-none pr-8 text-gray-600 cursor-pointer"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none group-focus-within:rotate-180 transition-transform" />
            </div>
          </div>
        </div>

        {/* Grid or Empty/Error States */}
        <div className="min-h-[40vh]">
          {loading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-[2rem] aspect-[4/6] animate-pulse border border-gray-100 p-0 overflow-hidden">
                    <div className="w-full aspect-[4/5] bg-gray-50"></div>
                  </div>
                ))}
              </div>
              
              {loadingTimeout && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm"
                >
                  <RefreshCw className="w-8 h-8 text-primary mb-4 animate-spin" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 text-center">
                    Está demorando mais que o esperado...
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="rounded-xl px-6 py-2 h-auto text-[9px] uppercase tracking-widest"
                  >
                    Recarregar Página
                  </Button>
                </motion.div>
              )}
            </div>
          ) : error ? (
            <div className="py-24 text-center bg-white rounded-[3rem] border border-red-50 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Ops! Erro ao carregar</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">{error}</p>
              <Button onClick={() => loadAds(true)} className="rounded-2xl px-10">Tentar Novamente</Button>
            </div>
          ) : ads.length > 0 ? (
            <div className="space-y-12">
              {mainAds.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {mainAds.map((ad, idx) => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx % 6 * 0.05 }}
                      className="active:scale-95 transition-transform duration-200"
                    >
                      <AdCard ad={ad} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                featuredAds.length === 0 && (
                  <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Nenhum anúncio encontrado</p>
                  </div>
                )
              )}

              {hasMore && (
                <div className="flex justify-center pt-12 pb-16 relative z-40">
                  <Button 
                    onClick={() => {
                      console.log("Carregando mais anúncios...");
                      loadAds(false);
                    }} 
                    disabled={loadingMore}
                    variant="outline"
                    className="rounded-2xl px-12 py-5 border-2 border-primary/20 hover:border-primary font-black uppercase tracking-[0.2em] text-[10px] gap-3 active:scale-95 transition-all shadow-xl hover:shadow-primary/10 bg-white"
                  >
                    {loadingMore ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Carregar Mais"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center p-8">
              <PackageOpen className="w-12 h-12 text-gray-200 mb-6" />
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Nada encontrado</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto mb-10">Não encontramos anúncios para esta categoria no momento.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  setFilters({ ...filters, category: 'Todos' });
                  setLocalSearch(''); 
                }} className="rounded-2xl">Limpar</Button>
                <Link to="/publicar"><Button className="rounded-2xl">Anunciar</Button></Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Map Promo Section */}
      {!loading && !filters.search && filters.category === 'Todos' && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gray-900 rounded-[3rem] p-10 sm:p-16 text-center relative overflow-hidden group shadow-2xl"
        >
          <div className="relative z-10 max-w-2xl mx-auto">
            <MapPin className="w-12 h-12 text-secondary mx-auto mb-6" />
            <h3 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-4">
              BUSQUE NO MAPA <br/>DE TEFÉ
            </h3>
            <p className="text-gray-400 text-sm mb-10">Encontre o que você precisa pertinho de você, navegando pelos bairros da cidade.</p>
            <Link to="/mapa">
              <Button className="bg-white text-gray-900 hover:bg-secondary hover:text-white rounded-full px-12 py-4 h-auto text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                Explorar Agora
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
