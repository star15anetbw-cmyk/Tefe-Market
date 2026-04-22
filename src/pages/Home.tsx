import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  AlertCircle
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

const SORT_OPTIONS = [
  { label: 'Mais Recentes', value: 'recent' },
  { label: 'Menor Preço', value: 'price_asc' },
  { label: 'Maior Preço', value: 'price_desc' },
];

export default function Home() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const requestRef = useRef(0);
  
  const [filters, setFilters] = useState<AdFilter>({
    search: '',
    category: 'Todos',
    type: 'all',
    condition: 'all',
    sortBy: 'recent'
  });

  const loadAds = useCallback(async (isInitial = true) => {
    const requestId = ++requestRef.current;
    
    if (isInitial) {
      setLoading(true);
      setError(null);
      setAds([]); // Limpa a lista atual para nova busca
      setPage(0);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Determinamos a página alvo antes da query
      const targetPage = isInitial ? 0 : page + 1;
      
      const result = await fetchAds({ 
        ...filters, 
        page: targetPage, 
        pageSize: 12 
      });
      
      // Proteção contra Race Condition: se uma nova busca começou, ignoramos esta resposta
      if (requestId !== requestRef.current) return;
      
      if (isInitial) {
        setAds(result.ads);
        setPage(0); // Resetamos o contador de página
      } else {
        setAds(prev => [...prev, ...result.ads]);
        setPage(targetPage);
      }
      
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (err: any) {
      if (requestId !== requestRef.current) return;
      console.error('Error loading ads:', err);
      setError(err.message || 'Não foi possível carregar os anúncios.');
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filters, page]);

  useEffect(() => {
    // A Home só carrega anúncios baseados em filtros de categoria/tipo/ordem
    // A busca textual agora é tratada apenas pelo redirecionamento no handleSearch
    loadAds(true);
  }, [filters.category, filters.type, filters.sortBy, filters.condition]);

  // Redireciona para a página de busca ao submeter
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchTerm = filters.search.trim();
    if (searchTerm) {
      navigate(`/buscar?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Lógica de separação: Destaques vs Lista Principal
  // A Home não mostra resultados de busca textual, apenas filtros globais
  const isDefaultView = filters.category === 'Todos' && page === 0 && filters.sortBy === 'recent';
  
  const featuredAds = isDefaultView ? ads.slice(0, 2) : [];
  const mainAds = isDefaultView ? ads.slice(2) : ads;

  // Logs temporários para depuração de renderização
  useEffect(() => {
    if (ads.length > 0 || totalCount > 0) {
      console.log('HOME_RENDER_DEBUG:', {
        totalCount: totalCount,
        adsLength: ads.length,
        featuredLength: featuredAds.length,
        mainLength: mainAds.length,
        isDefaultView: isDefaultView,
        searchQuery: filters.search
      });
    }
  }, [ads, featuredAds, mainAds, isDefaultView, totalCount, filters.search]);

  return (
    <div className="flex flex-col min-h-screen bg-bg-main">
      {/* Header Section (Branded) */}
      <div className="bg-primary pt-6 pb-16 px-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl sm:text-7xl font-black text-white mb-2 uppercase tracking-tighter leading-[0.85]">
              O QUE VOCÊ <br/>
              <span className="text-secondary italic">PROCURA</span> HOJE?
            </h1>
            <p className="hidden sm:block text-white/50 text-[10px] font-bold uppercase tracking-[0.4em] mb-8">
              Encontre tudo o que precisa na cidade de Tefé
            </p>
          </motion.div>
          
          {/* Main Search Bar */}
          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-accent rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden p-1.5 border border-white/20">
              <Search className="absolute left-5 w-5 h-5 text-gray-300" />
              <input 
                type="text" 
                placeholder="Busque por produtos, serviços ou imóveis..." 
                className="w-full pl-14 pr-6 py-4 text-sm sm:text-lg text-gray-900 bg-transparent outline-none placeholder:text-gray-300 font-bold tracking-tight"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <div className="hidden sm:flex items-center gap-2 pr-2">
                <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>
                <Button 
                  type="submit"
                  className="rounded-xl px-6 py-3 h-auto text-xs uppercase tracking-widest font-black"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full -mt-10 px-4 relative z-20 space-y-8 pb-32">
        {/* Categories Carousel */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-white p-4">
          <div className="flex overflow-x-auto no-scrollbar gap-4 py-2">
            <button
              onClick={() => {
                if (filters.category === 'Todos') {
                  loadAds(true); // Force reload if already selected
                } else {
                  setFilters({ ...filters, category: 'Todos' });
                }
              }}
              className={cn(
                "flex flex-col items-center gap-2 flex-shrink-0 group transition-all min-w-[70px]",
                filters.category === 'Todos' ? "scale-105" : "opacity-50 hover:opacity-100"
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                filters.category === 'Todos' ? "bg-primary text-white shadow-xl shadow-primary/30" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
              )}>
                <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-center">Todos</span>
            </button>

            {VISUAL_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setFilters({ ...filters, category: cat.name })}
                className={cn(
                  "flex flex-col items-center gap-2 flex-shrink-0 group transition-all min-w-[70px]",
                  filters.category === cat.name ? "scale-105" : "opacity-50 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                  filters.category === cat.name ? "bg-primary text-white shadow-xl shadow-primary/30" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                )}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <AnimatePresence>
          {featuredAds.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-secondary fill-secondary" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 border-b-2 border-secondary/30 pb-1">
                  🔥 Oportunidades em Destaque
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {featuredAds.map(ad => (
                  <AdCard key={ad.id} ad={ad} featured />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Main Feed Section */}
        <main className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal className="w-3 h-3" />
                {totalCount} Anúncios
              </div>
              <div className="hidden sm:block h-6 w-[1px] bg-gray-100"></div>
              <div className="hidden sm:flex items-center gap-2">
                {['all', 'sale', 'rent'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilters({ ...filters, type: t as any })}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                      filters.type === t ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-primary"
                    )}
                  >
                    {t === 'all' ? 'Ver Tudo' : t === 'sale' ? 'Venda' : 'Aluguel'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="relative flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:border-primary transition-colors group">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 mr-2" />
                <select 
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none appearance-none pr-8 text-gray-600 cursor-pointer"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-[2rem] aspect-[3/4] animate-pulse border border-gray-100 shadow-sm overflow-hidden p-2">
                    <div className="w-full h-[60%] bg-gray-50 rounded-2xl"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-50 rounded-full w-3/4"></div>
                      <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-red-50 shadow-xl shadow-red-500/5">
                <div className="bg-red-50 p-10 rounded-full mb-6">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Ops! Problema de conexão</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-medium">
                  {error}
                </p>
                <Button onClick={() => loadAds(true)} className="rounded-2xl px-10 bg-red-500 shadow-red-500/20">
                  Tentar Novamente
                </Button>
              </div>
            ) : ads.length > 0 ? (
              <div className="space-y-12">
                {/* Seção Principal de Cards */}
                {mainAds.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {mainAds.map((ad, idx) => (
                      <motion.div
                        key={ad.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <AdCard ad={ad} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  /* Fallback se mainAds estiver vazio mas ads existirem (estão nos destaques) */
                  featuredAds.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Nenhum anúncio encontrado nesta seção</p>
                    </div>
                  )
                )}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-8 pb-12">
                    <Button 
                      onClick={() => loadAds(false)} 
                      disabled={loadingMore}
                      variant="outline"
                      className="rounded-2xl px-12 py-6 border-2 font-black uppercase tracking-[0.2em] text-[10px] gap-3 group"
                    >
                      {loadingMore ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Carregar Mais Anúncios
                          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                <div className="bg-gray-50 p-10 rounded-full mb-6 relative">
                  <PackageOpen className="w-12 h-12 text-gray-200" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-secondary rounded-full flex items-center justify-center text-white text-[10px] font-bold">?</div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Nenhum tesouro encontrado</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-10 font-medium leading-relaxed">
                  Não encontramos nada com esses filtros. Que tal tentar uma busca mais genérica ou limpar os filtros?
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ ...filters, search: '', category: 'Todos', type: 'all' })}
                    className="rounded-2xl px-8 border-2"
                  >
                    Limpar Filtros
                  </Button>
                  <Link to="/publicar">
                    <Button className="rounded-2xl px-8 shadow-xl shadow-primary/20">
                      Anunciar algo agora
                    </Button>
                  </Link>
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
            className="bg-gray-900 rounded-[3rem] p-8 sm:p-12 text-center relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <MapPin className="w-12 h-12 text-secondary mx-auto mb-6 animate-bounce" />
              <h3 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                ENCONTRE O QUE <br/>PRECISA NO SEU BAIRRO
              </h3>
              <p className="text-gray-400 text-sm mb-10 font-medium">
                Vários anúncios estão pertinho de você em Tefé. Use nosso mapa interativo para localizar as melhores ofertas.
              </p>
              <Link to="/mapa">
                <Button className="bg-white text-gray-900 hover:bg-secondary hover:text-white rounded-full px-12 py-4 h-auto text-sm font-black uppercase tracking-widest shadow-2xl transition-all">
                  Explorar no mapa
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
