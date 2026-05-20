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
  User,
  Shirt,
  Sofa,
  Tv,
  Trophy,
  Briefcase
} from 'lucide-react';
import { cn, isNonCriticalSupabaseError, smartShuffle } from '../lib/utils';
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
  { name: 'Veículos', icon: Bike, color: 'bg-emerald-500' },
  { name: 'Imóveis', icon: HomeIcon, color: 'bg-orange-500' },
  { name: 'Eletrônicos', icon: Smartphone, color: 'bg-emerald-600' },
  { name: 'Móveis', icon: Sofa, color: 'bg-amber-600' },
  { name: 'Vestuário', icon: Shirt, color: 'bg-amber-500' },
  { name: 'Eletrodomésticos', icon: Tv, color: 'bg-blue-600' },
  { name: 'Ferramentas', icon: Wrench, color: 'bg-blue-500' },
  { name: 'Esportes', icon: Trophy, color: 'bg-emerald-700' },
  { name: 'Serviços', icon: Briefcase, color: 'bg-purple-600' },
  { name: 'Outros', icon: Box, color: 'bg-gray-500' },
];

const SORT_OPTIONS = [
  { label: 'Recomendados', value: 'recommended' },
  { label: 'Mais Recentes', value: 'recent' },
  { label: 'Menor Preço', value: 'price_asc' },
  { label: 'Maior Preço', value: 'price_desc' },
];

const SEARCH_EXAMPLES = [
  'diarista', 'lava jato', 'casa para alugar', 'moto à venda', 'manicure', 
  'celular', 'terreno', 'internet', 'frete', 'pedreiro', 'carrocinha', 
  'jardineiro', 'encanador', 'eletricista', 'técnico de ar condicionado', 
  'cabeleireira', 'moto usada', 'iPhone', 'terreno à venda', 'casa à venda', 
  'aluguel', 'serviço de limpeza', 'mecânico', 'pintura', 'mudança', 'eletrônicos'
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const [localSearch, setLocalSearch] = useState('');
  const [filtersState, setFiltersState] = useState<AdFilter>({
    search: '',
    category: 'Todos',
    type: 'all',
    condition: 'all',
    neighborhood: 'Todos os bairros',
    sortBy: 'recommended'
  });

  const filters = React.useMemo(() => ({
    category: filtersState.category,
    type: filtersState.type,
    sortBy: filtersState.sortBy,
    condition: filtersState.condition,
    search: filtersState.search,
    neighborhood: filtersState.neighborhood
  }), [
    filtersState.category,
    filtersState.type,
    filtersState.sortBy,
    filtersState.condition,
    filtersState.search,
    filtersState.neighborhood
  ]);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Typewriter placeholder state
  const [placeholder, setPlaceholder] = useState('Busque por produtos, serviços...');
  const [charIndex, setCharIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect logic
  useEffect(() => {
    // Stop animation if user is typing or input is focused
    if (localSearch || isInputFocused) {
      setPlaceholder('Busque por produtos, serviços...');
      return;
    }

    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDuration = 2000;
    const currentExample = SEARCH_EXAMPLES[exampleIndex];
    const fullText = `Busque por ${currentExample}`;

    let timer: NodeJS.Timeout;

    if (!isDeleting && charIndex <= fullText.length) {
      // Typing
      setPlaceholder(fullText.substring(0, charIndex));
      timer = setTimeout(() => setCharIndex(prev => prev + 1), typingSpeed);
    } else if (isDeleting && charIndex >= 0) {
      // Deleting
      setPlaceholder(fullText.substring(0, charIndex));
      timer = setTimeout(() => setCharIndex(prev => prev - 1), deletingSpeed);
    } else if (!isDeleting && charIndex > fullText.length) {
      // Finished typing, wait before deleting
      timer = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else {
      // Finished deleting or error state, move to next example
      setIsDeleting(false);
      setExampleIndex(prev => (prev + 1) % SEARCH_EXAMPLES.length);
      setCharIndex(0);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, exampleIndex, localSearch, isInputFocused]);

  const pageRef = useRef(0);
  const initialLoadDoneRef = useRef(false);
  const lastFilterSnapshotRef = useRef("");
  const lastLoadedFilterKeyRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const loadingAdsRef = useRef(false);
  const lastRequestIdRef = useRef(0);
  const isDefaultHomeMode = React.useMemo(() => {
    const category = filters.category?.trim().toLowerCase() || '';
    const type = filters.type?.trim().toLowerCase() || '';
    const condition = filters.condition?.trim().toLowerCase() || '';
    const neighborhood = filters.neighborhood?.trim().toLowerCase() || '';
    return (
      ['todos', 'todas', ''].includes(category) &&
      ['all', 'todos', ''].includes(type) &&
      ['all', 'todos', ''].includes(condition) &&
      ['todos os bairros', 'todos', ''].includes(neighborhood) &&
      !filters.search?.trim()
    );
  }, [filters.category, filters.type, filters.condition, filters.neighborhood, filters.search]);

  const loadAdsData = useCallback(async (isInitial = true) => {
    if (loadingAdsRef.current && !isInitial) {
      console.warn("HOME_LOAD_ADS_SKIPPED_ALREADY_LOADING");
      return;
    }

    if (isInitial && loadingAdsRef.current) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingAdsRef.current = false;
    }

    const requestId = ++lastRequestIdRef.current;
    requestRef.current = requestId;
    loadingAdsRef.current = true;
    isLoadingRef.current = true;

    // Se for um novo carregamento inicial, resetamos a página
    if (isInitial) {
      console.debug("LOAD_INITIAL_START", { requestId });
      console.log("HOME_FILTERS_ACTIVE", filters);
      console.log("HOME_INITIAL_MODE", { isInitialHome: isDefaultHomeMode, requestId });
      console.log("HOME_LOAD_ADS_START", { requestId });
      setLoading(true);
      setError(null);
      setLoadingTimeout(false);
      setPage(0);
      pageRef.current = 0;
    } else {
      console.debug("LOAD_MORE_CLICK", { requestId });
      setLoadingMore(true);
    }

    console.debug("FETCH_ADS_INPUT", { 
      category: filters.category,
      type: filters.type,
      search: filters.search,
      neighborhood: filters.neighborhood,
      isInitial,
      requestId
    });

    const controller = new AbortController();
    if (isInitial) {
      abortControllerRef.current = controller;
    }

    // Backup timeout de segurança (20 segundos)
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && requestId === lastRequestIdRef.current) {
        console.warn("LOAD_ADS_TIMEOUT_SLOW", { requestId });
        setLoadingTimeout(true);
      }
    }, 20000);
    
    try {
      const targetPage = isInitial ? 0 : pageRef.current + 1;
      const pageSize = 12;
      const requestFilter = isDefaultHomeMode ? {
        sortBy: filters.sortBy,
        page: targetPage,
        pageSize
      } : {
        category: filters.category,
        type: filters.type,
        sortBy: filters.sortBy,
        condition: filters.condition,
        search: filters.search,
        neighborhood: filters.neighborhood,
        page: targetPage,
        pageSize
      };
      
      let result = await fetchAds(requestFilter, controller.signal);

      // Se der zero na carga inicial, fizermos segunda busca sem filtros como fallback
      if (isInitial && (!result.ads || result.ads.length === 0)) {
        const hasActiveFilters = 
          (filters.category && !['todos', 'todas', 'todos os anúncios', 'todos os anuncios', ''].includes(filters.category.trim().toLowerCase())) ||
          (filters.type && !['all', 'todos', ''].includes(filters.type.trim().toLowerCase())) ||
          (filters.neighborhood && !['todos os bairros', 'todos', ''].includes(filters.neighborhood.trim().toLowerCase())) ||
          (filters.search && filters.search.trim().length > 0);

        if (isDefaultHomeMode) {
          console.warn("HOME_EMPTY_INITIAL_FALLBACK_START", { requestId });
          const fallbackResult = await fetchAds({
            page: 0,
            pageSize,
            sortBy: 'recent'
          }, controller.signal);
          console.log("HOME_EMPTY_INITIAL_FALLBACK_SUCCESS", {
            count: fallbackResult?.ads?.length || 0,
            totalCount: fallbackResult?.totalCount,
            hasMore: fallbackResult?.hasMore,
            requestId
          });

          if (fallbackResult && fallbackResult.ads && fallbackResult.ads.length > 0) {
            result = fallbackResult;
          }
        } else if (hasActiveFilters) {
          console.warn("HOME_EMPTY_RESULT_FALLBACK_RECENT");
          const fallbackResult = await fetchAds({
            page: 0,
            pageSize
          }, controller.signal);
          
          if (fallbackResult && fallbackResult.ads && fallbackResult.ads.length > 0) {
            result = fallbackResult;
            // Limpa o lastLoadedFilterKeyRef para permitir que o usuário mude filtros novamente sem ficar travado
            lastLoadedFilterKeyRef.current = null;
          }
        }
      }
      
      clearTimeout(timeoutId);

      if (!isMountedRef.current) return;

      if (requestId !== lastRequestIdRef.current) {
        console.warn("HOME_LOAD_ADS_IGNORED_OLD_REQUEST", { requestId });
        return;
      }
      
      if (isInitial) {
        const adsList = Array.isArray(result.ads) ? result.ads : [];
        console.log("HOME_SET_ADS", {
          incoming: adsList.length,
          requestId,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          firstAd: adsList[0]
            ? {
                id: adsList[0].id,
                title: adsList[0].title,
                status: adsList[0].status,
                category: adsList[0].category
              }
            : null
        });
        setAds(adsList);
        setPage(0);
        pageRef.current = 0;
        setLoadingTimeout(false);
        console.log("HOME_LOAD_ADS_SUCCESS", {
          count: adsList.length,
          requestId,
          totalCount: result.totalCount,
          hasMore: result.hasMore
        });
        console.debug("FETCH_ADS_SUCCESS: Initial load finished", { count: adsList.length, requestId });
      } else {
        const returnedAds = Array.isArray(result.ads) ? result.ads : [];
        setAds(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const deduplicatedNewAds = returnedAds.filter(a => !existingIds.has(a.id));
          return [...prev, ...deduplicatedNewAds];
        });
        setPage(targetPage);
        pageRef.current = targetPage;
        console.debug("FETCH_ADS_SUCCESS: Load more finished", { count: returnedAds.length, requestId });
      }
      
      setTotalCount(result.totalCount || 0);
      setHasMore(result.hasMore || false);
      setError(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (requestId !== lastRequestIdRef.current) return;
      
      if (err.name === 'AbortError' || err?.message?.includes('AbortError') || err?.message?.includes('signal is aborted')) {
        console.debug("FETCH_ADS_ABORTED_IGNORED", err);
        return;
      }
      
      console.error('HOME_LOAD_ADS_ERROR:', err);
      if (isInitial) {
        setError(err.message || 'Não foi possível carregar os anúncios agora.');
        setLoadingTimeout(false);
      }
    } finally {
      if (isMountedRef.current && requestId === lastRequestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
        isLoadingRef.current = false;
        loadingAdsRef.current = false;
        if (isInitial) {
           console.log("HOME_LOAD_ADS_FINISHED", { requestId });
           console.debug("LOAD_ADS_FINISHED", { requestId });
        }
      }
    }
  }, [
    filters.category, 
    filters.type, 
    filters.sortBy, 
    filters.condition, 
    filters.search,
    filters.neighborhood,
    isDefaultHomeMode
  ]);

  // Wrapper functions for clarity as requested
  const loadInitialAds = useCallback(() => {
    loadAdsData(true);
  }, [loadAdsData]);

  const loadMoreAds = useCallback(() => {
    loadAdsData(false);
  }, [loadAdsData]);

  const resetHomeFilters = useCallback(() => {
    const defaultFilters: AdFilter = {
      search: '',
      category: 'Todos',
      type: 'all',
      condition: 'all',
      neighborhood: 'Todos os bairros',
      sortBy: 'recommended'
    };

    setFiltersState(defaultFilters);
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

  const filterKey = React.useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (lastLoadedFilterKeyRef.current === filterKey && initialLoadDoneRef.current) {
      console.debug("HOME_LOAD_ADS_SKIPPED_SAME_FILTER", { filterKey });
      return;
    }

    lastLoadedFilterKeyRef.current = filterKey;
    initialLoadDoneRef.current = true;
    
    loadInitialAds();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filterKey, loadInitialAds]);

  // Watch for long loading states
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 20000);
    } else {
      setLoadingTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Debounce search input to avoid many re-renders/fetches if search becomes live
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltersState(prev => {
        if (prev.search === localSearch) return prev;
        return { ...prev, search: localSearch };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Redireciona para a página de busca ao submeter
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchTerm = localSearch.trim();
    if (searchTerm) {
      navigate(`/buscar?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const scoresRef = useRef<Record<string, number>>({});

  // Lógica de separação e ordenação inteligente: Destaques vs Lista Principal
  const processedAds = React.useMemo(() => {
    if (filters.sortBy !== 'recommended') return ads;

    // Use smartShuffle logic with stable random factors
    const sorted = [...ads].sort((a, b) => {
      // Ensure each ad has a stable random factor for this session
      if (scoresRef.current[a.id] === undefined) scoresRef.current[a.id] = Math.random() * 2;
      if (scoresRef.current[b.id] === undefined) scoresRef.current[b.id] = Math.random() * 2;

      // Local recency boost (7 days)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
      const dateB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
      const ageA = (Date.now() - dateA) / (1000 * 60 * 60 * 24);
      const ageB = (Date.now() - dateB) / (1000 * 60 * 60 * 24);
      const boostA = Math.exp(-ageA / 7) * 1.5;
      const boostB = Math.exp(-ageB / 7) * 1.5;

      const scoreA = scoresRef.current[a.id] + boostA;
      const scoreB = scoresRef.current[b.id] + boostB;

      return scoreB - scoreA;
    });

    return sorted;
  }, [ads, filters.sortBy]);

  const featuredAds = React.useMemo(() => {
    const isMainHome = filters.category === 'Todos' && !filters.search && filters.type === 'all';
    if (!isMainHome || processedAds.length === 0) return [];
    
    // Seleciona os primeiros 8 da lista já processada/ordenada para serem os destaques
    return processedAds.slice(0, 8);
  }, [processedAds, filters.category, filters.search, filters.type]);

  const mainAds = React.useMemo(() => {
    const isMainHome = filters.category === 'Todos' && !filters.search && filters.type === 'all';
    if (isMainHome) {
      // Na home padrão, remove os que já estão no destaque para evitar duplicidade visual imediata na mesma página
      const featuredIds = new Set(featuredAds.map(a => a.id));
      return processedAds.filter(ad => !featuredIds.has(ad.id));
    }
    return processedAds;
  }, [processedAds, featuredAds, filters.category, filters.search, filters.type]);
  
  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const initialLoading = loading;
  const selectedCategory = filters.category;
  const selectedType = filters.type;

  console.log("HOME_RENDER_ADS", {
    adsLength: ads.length,
    processedAdsLength: processedAds.length,
    featuredAdsLength: featuredAds.length,
    mainAdsLength: mainAds.length,
    loading,
    initialLoading,
    isDefaultHomeMode,
    selectedCategory,
    selectedType,
    search: filters?.search,
    sortBy: filters?.sortBy
  });

  return (
    <div className="flex flex-col min-h-screen bg-bg-main w-full max-w-full overflow-x-hidden">
      {/* Header Section (Branded) */}
      <div className="bg-white pt-1 pb-2 sm:pt-12 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-8">
          {/* Main Search Bar - OLX Style */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-1 group focus-within:shadow-xl focus-within:ring-4 focus-within:ring-primary/5 transition-all">
              <input 
                type="text" 
                placeholder={placeholder}
                className="w-full pl-5 pr-10 py-2 sm:py-4 text-sm sm:text-base text-gray-900 bg-transparent outline-none placeholder:text-gray-400 font-bold"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <button 
                type="submit"
                className="absolute right-2 px-3 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem]"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Buscar</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto w-full px-3 sm:px-6 space-y-4 sm:space-y-16 pb-32">
        {/* Categories Circle Icons */}
        <div className="space-y-1 sm:space-y-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] sm:text-base font-black uppercase tracking-[0.2em] text-gray-900">Categorias</h2>
            <Link to="/buscar" className="text-primary text-[8px] sm:text-xs font-black uppercase tracking-widest hover:underline">Ver todas</Link>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-12 overflow-x-auto no-scrollbar py-2 px-1 -mx-3 sm:mx-0">
            <motion.button
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => resetHomeFilters()}
              className="flex flex-col items-center gap-2 min-w-[55px] sm:min-w-[70px] group transition-all"
            >
              <div className={cn(
                "w-11 h-11 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] flex items-center justify-center transition-all shadow-md group-hover:shadow-primary/20",
                filters.category === 'Todos' ? "bg-primary text-white scale-110" : "bg-white text-gray-400 border border-gray-100 hover:border-primary/20 hover:text-primary"
              )}>
                <RefreshCw className={cn("w-5 h-5 sm:w-7 sm:h-7", loading && "animate-spin")} />
              </div>
              <span className={cn("text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-colors", filters.category === 'Todos' ? "text-primary" : "text-gray-400")}>
                Início
              </span>
            </motion.button>

              {VISUAL_CATEGORIES.map((cat, idx) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFiltersState({ ...filters, category: cat.name })}
                  className="flex flex-col items-center gap-2 min-w-[55px] sm:min-w-[70px] group transition-all"
                >
                  <div className={cn(
                    "w-11 h-11 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] flex items-center justify-center transition-all shadow-md group-hover:shadow-xl",
                    filters.category === cat.name 
                      ? "bg-primary text-white scale-110" 
                      : `${cat.color} text-white hover:scale-105`
                  )}>
                    <cat.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <span className={cn("text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-colors", filters.category === cat.name ? "text-primary " : "text-gray-400")}>
                    {cat.name}
                  </span>
                </motion.button>
              ))}
          </div>
        </div>

        {/* Featured Section Section */}
        <AnimatePresence>
          {featuredAds.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-2 sm:space-y-8 max-w-7xl mx-auto"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] sm:text-base font-black uppercase tracking-[0.2em] text-gray-900">
                  Em destaque
                </h2>
              </div>
              
              <Swiper
                modules={[Navigation, FreeMode]}
                spaceBetween={12}
                slidesPerView="auto"
                freeMode={true}
                className="featured-swiper !px-1 !-mx-1 sm:!px-2 sm:!mx-0 !overflow-visible"
              >
                {featuredAds.map(ad => (
                  <SwiperSlide key={ad.id} className="!w-[160px] sm:!w-[280px]">
                    <AdCard ad={ad} featured />
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.section>
          )}
        </AnimatePresence>

      {/* Main Feed Section */}
      <main className="space-y-4 sm:space-y-8 relative z-30 max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] sm:text-base font-black uppercase tracking-[0.2em] text-gray-900">
            {filters.category === 'Todos' ? 'Anúncios recentes' : `Anúncios em ${filters.category}`}
          </h2>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4">
          <div 
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar lg:scrollbar-thin lg:scrollbar-thumb-gray-200 lg:scrollbar-track-transparent pb-1"
            onWheel={handleWheelScroll}
          >
            {['all', 'sale', 'rent', 'service'].map((t) => (
              <button
                key={t}
                onClick={() => setFiltersState({ ...filters, type: t as any })}
                className={cn(
                  "px-2.5 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase tracking-widest transition-all border",
                  filters.type === t ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                )}
              >
                {t === 'all' ? 'Tudo' : t === 'sale' ? 'Venda' : t === 'rent' ? 'Aluguel' : 'Serviços'}
              </button>
            ))}
            <div className="h-4 sm:h-6 w-[1px] bg-gray-200 mx-1 flex-shrink-0"></div>
            <span className="text-[7px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              {totalCount} itens
            </span>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="relative flex items-center bg-white rounded-lg px-2 sm:px-4 py-1 sm:py-2 border border-gray-100 group">
              <select 
                className="bg-transparent text-[7px] sm:text-[9px] font-black uppercase tracking-widest outline-none appearance-none pr-5 sm:pr-8 text-gray-600 cursor-pointer"
                value={filters.sortBy}
                onChange={(e) => setFiltersState({ ...filters, sortBy: e.target.value as any })}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-2 sm:w-3 h-2 sm:h-3 text-gray-400 absolute right-2 sm:right-3 pointer-events-none group-focus-within:rotate-180 transition-transform" />
            </div>
          </div>
        </div>

        {/* Grid or Empty/Error States */}
        <div className="min-h-[40vh]">
          {loading ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-white rounded-xl sm:rounded-2xl aspect-[4/6] animate-pulse border border-gray-100 p-2 sm:p-3 overflow-hidden flex flex-col gap-2 sm:gap-3">
                    <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg sm:rounded-xl"></div>
                    <div className="space-y-2">
                       <div className="h-2.5 sm:h-3 bg-gray-50 rounded w-3/4"></div>
                       <div className="h-2.5 sm:h-3 bg-gray-50 rounded w-1/2"></div>
                    </div>
                    <div className="mt-auto flex justify-between items-center">
                       <div className="h-3 sm:h-4 bg-gray-100 rounded w-1/3"></div>
                       <div className="h-1.5 sm:h-2 bg-gray-50 rounded w-1/4"></div>
                    </div>
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
              <Button onClick={() => {
                setError(null);
                isLoadingRef.current = false;
                lastLoadedFilterKeyRef.current = null;
                loadInitialAds();
              }} className="rounded-2xl px-10">Tentar Novamente</Button>
            </div>
          ) : ads.length > 0 ? (
            <div className="space-y-8 sm:space-y-12">
              {mainAds.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-6">
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

              {hasMore ? (
                <div className="flex justify-center pt-12 pb-16 relative z-40">
                  <Button 
                    onClick={loadMoreAds} 
                    disabled={loadingMore}
                    variant="outline"
                    className={cn(
                      "rounded-2xl px-12 py-5 border-2 border-primary/20 hover:border-primary font-black uppercase tracking-[0.2em] text-[10px] gap-3 active:scale-95 transition-all shadow-xl hover:shadow-primary/10 bg-white",
                      loadingMore && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Carregando...</span>
                      </>
                    ) : (
                      "Carregar Mais"
                    )}
                  </Button>
                </div>
              ) : mainAds.length > 0 && (
                <div className="flex justify-center pt-12 pb-16 relative z-40">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                    Todos os anúncios foram carregados
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center p-8">
              <PackageOpen className="w-12 h-12 text-gray-200 mb-6" />
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Nada encontrado</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto mb-10">
                {isDefaultHomeMode ? 'Nenhum anúncio disponível no momento.' : 'Não encontramos anúncios para esta categoria no momento.'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  setFiltersState({ ...filters, category: 'Todos' });
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
