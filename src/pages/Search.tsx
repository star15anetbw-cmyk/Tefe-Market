import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchAds } from '../services/ads';
import { Ad, AdFilter } from '../types';
import AdCard from '../components/AdCard';
import { Search as SearchIcon, Filter, MapPin } from 'lucide-react';
import { CATEGORIES, FILTER_NEIGHBORHOODS } from '../constants';
import Button from '../components/ui/Button';
import { cn, isNonCriticalSupabaseError } from '../lib/utils';

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
    condition: 'all'
  });

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

  const loadAds = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const result = await fetchAds(filters, signal);
      setAds(Array.isArray(result.ads) ? result.ads : []);
    } catch (err: any) {
      if (err.name === 'AbortError' || isNonCriticalSupabaseError(err)) return;
      console.error('Error loading search ads:', err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    loadAds(controller.signal);
    return () => controller.abort();
  }, [loadAds]);

  return (
    <div className="min-h-screen bg-bg pb-20">
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto p-4">
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
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white rounded-3xl aspect-[4/6] animate-pulse border border-gray-100 shadow-sm overflow-hidden p-0 flex flex-col">
                <div className="w-full aspect-[4/5] bg-gray-100"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full w-2/3"></div>
                  <div className="h-2 bg-gray-50 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : ads.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {ads.map(ad => (
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
                  setFilters({ search: '', category: 'Todos', type: 'all', condition: 'all' });
                  setSearchParams({});
                }}
              >
                Limpar Busca
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
