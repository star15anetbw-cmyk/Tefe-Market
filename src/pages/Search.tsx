import { cn, isNonCriticalSupabaseError, smartShuffle } from '../lib/utils';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchAds } from '../services/ads';
import { Ad, AdFilter } from '../types';
import AdCard from '../components/AdCard';
import { Search as SearchIcon, Filter, MapPin, ChevronDown, RefreshCw } from 'lucide-react';
import { CATEGORIES, FILTER_NEIGHBORHOODS } from '../constants';
import Button from '../components/ui/Button';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTerm = searchParams.get('search') || '';
  const queryNeighborhood = searchParams.get('neighborhood') || 'Todos os bairros';

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(queryTerm);
  const [filters, setFilters] = useState<AdFilter>({
    search: queryTerm,
    neighborhood: queryNeighborhood,
    category: 'Todos',
    type: 'all',
    condition: 'all',
    sortBy: 'recommended'
  });

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(0);

  const scoresRef = useRef<Record<string, number>>({});

  const processedAds = useMemo(() => {
    if (filters.sortBy !== 'recommended') return ads;

    const sorted = [...ads].sort((a, b) => {
      if (scoresRef.current[a.id] === undefined) scoresRef.current[a.id] = Math.random() * 2;
      if (scoresRef.current[b.id] === undefined) scoresRef.current[b.id] = Math.random() * 2;
      return scoresRef.current[b.id] - scoresRef.current[a.id];
    });
    return sorted;
  }, [ads, filters.sortBy]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        if (prev.search === localSearch) return prev;
        return { ...prev, search: localSearch };
      });
      
      const params: any = {};
      if (localSearch) params.search = localSearch;
      if (filters.neighborhood && filters.neighborhood !== 'Todos os bairros') params.neighborhood = filters.neighborhood;
      
      setSearchParams(params, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, filters.neighborhood, setSearchParams]);

  // Sync with URL query term
  useEffect(() => {
    if (queryTerm !== localSearch) {
      setLocalSearch(queryTerm);
      setFilters(prev => ({ ...prev, search: queryTerm }));
    }
  }, [queryTerm]);

  const loadAds = useCallback(async (isInitial = true, signal?: AbortSignal) => {
    if (isInitial) {
      setLoading(true);
      pageRef.current = 0;
    } else {
      setLoadingMore(true);
    }

    try {
      const targetPage = isInitial ? 0 : pageRef.current + 1;
      const pageSize = 12;

      console.log('SEARCH_LOAD_ADS_TRIGGER', {
        isInitial,
        selectedCategory: filters.category,
        selectedType: filters.type,
        search: filters.search
      });

      console.log(`SEARCH_${isInitial ? 'INITIAL' : 'LOAD_MORE'}_FETCH`, {
        page: targetPage,
        filters
      });

      const result = await fetchAds({ ...filters, page: targetPage, pageSize }, signal);
      
      if (isInitial) {
        setAds(Array.isArray(result.ads) ? result.ads : []);
        pageRef.current = 0;
      } else {
        setAds(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAds = (Array.isArray(result.ads) ? result.ads : []).filter(a => !existingIds.has(a.id));
          
          console.log('SEARCH_LOAD_MORE_RESULT', {
            returnedCount: (result.ads || []).length,
            newAdsCount: newAds.length,
            totalCount: result.totalCount,
            hasMore: result.hasMore
          });

          return [...prev, ...newAds];
        });
        pageRef.current = targetPage;
      }
      setHasMore(result.hasMore);
    } catch (err: any) {
      if (err.name === 'AbortError' || isNonCriticalSupabaseError(err)) return;
      console.error('Error loading search ads:', err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    loadAds(true, controller.signal);
    return () => controller.abort();
  }, [filters.category, filters.neighborhood, filters.type, filters.condition, filters.sortBy, filters.search]);

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="O que você procura em Tefé?"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none transition-all"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                }}
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
            <Link 
              to="/mapa"
              className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-2 group"
              title="Ver no Mapa"
            >
              <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoria</h3>
                <div className="flex flex-wrap gap-2">
                  {['Todos', ...CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilters({ ...filters, category: cat })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
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
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bairro</h3>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:border-primary outline-none appearance-none transition-all"
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

              <div className="grid grid-cols-2 gap-4">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tipo</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                    {['all', 'sale', 'rent', 'service'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilters({ ...filters, type: type as any })}
                        className={cn(
                          "flex-1 py-1.5 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                          filters.type === type ? "bg-white text-primary shadow-sm" : "text-gray-400"
                        )}
                      >
                        {type === 'all' ? 'Tudo' : type === 'sale' ? 'Venda' : type === 'rent' ? 'Aluguel' : 'Serviços'}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Condição</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'new', 'used'].map(cond => (
                      <button
                        key={cond}
                        onClick={() => setFilters({ ...filters, condition: cond as any })}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                          filters.condition === cond ? "bg-white text-primary shadow-sm" : "text-gray-400"
                        )}
                      >
                        {cond === 'all' ? 'Tudo' : cond === 'new' ? 'Novo' : 'Usado'}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ordenação</h3>
                  <div className="relative">
                    <select
                      className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:border-primary outline-none appearance-none transition-all"
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    >
                      <option value="recommended">Recomendados</option>
                      <option value="recent">Mais recentes</option>
                      <option value="price_asc">Menor preço</option>
                      <option value="price_desc">Maior preço</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {processedAds.length} resultados encontrados
          </span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white rounded-2xl aspect-[4/6] animate-pulse border border-gray-100 p-3 overflow-hidden flex flex-col gap-3">
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl"></div>
                <div className="space-y-2">
                   <div className="h-3 bg-gray-50 rounded w-3/4"></div>
                   <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                </div>
                <div className="mt-auto flex justify-between items-center">
                   <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                   <div className="h-2 bg-gray-50 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : processedAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {processedAds.map(ad => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center p-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
              <SearchIcon className="w-10 h-10 text-emerald-200" />
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs">?</div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Nada encontrado 😕</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-10 font-medium leading-relaxed">
              Tente buscar por outro termo ou seja o primeiro a anunciar!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Link to="/publicar" className="flex-1">
                <Button className="w-full rounded-2xl px-8 shadow-xl shadow-primary/20 py-4 h-auto font-black uppercase tracking-widest text-xs">
                  Anunciar Agora
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="flex-1 rounded-2xl px-8 border-2 py-4 h-auto font-black uppercase tracking-widest text-xs"
                onClick={() => {
                  setLocalSearch('');
                  setFilters({ search: '', category: 'Todos', type: 'all', condition: 'all', neighborhood: 'Todos os bairros', sortBy: 'recommended' });
                  setSearchParams({});
                }}
              >
                Limpar Busca
              </Button>
            </div>
          </div>
        )}

        {hasMore ? (
          <div className="mt-12 flex justify-center pb-20">
            <Button
              onClick={() => loadAds(false)}
              disabled={loadingMore}
              variant="outline"
              className="rounded-2xl px-12 py-4 border-2 border-primary/20 hover:border-primary font-black uppercase tracking-widest text-[10px] gap-3 active:scale-95 transition-all shadow-xl hover:shadow-primary/10 bg-white"
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
        ) : ads.length > 0 && (
          <div className="mt-12 flex justify-center pb-20">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
              Todos os resultados foram carregados
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
