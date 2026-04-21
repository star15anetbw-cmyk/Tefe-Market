import React, { useState, useEffect } from 'react';
import { fetchAds } from '../services/ads';
import { Ad, AdFilter } from '../types';
import AdCard from '../components/AdCard';
import { Search as SearchIcon, Filter, X, MapPin } from 'lucide-react';
import { CATEGORIES, NEIGHBORHOODS } from '../constants';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Search() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [filters]);

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

              <div className="grid grid-cols-2 gap-4">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tipo</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'sale', 'rent'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilters({ ...filters, type: type as any })}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                          filters.type === type ? "bg-white text-primary shadow-sm" : "text-gray-400"
                        )}
                      >
                        {type === 'all' ? 'Tudo' : type === 'sale' ? 'Venda' : 'Aluguel'}
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
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-xl aspect-[4/5] animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : ads.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {ads.map(ad => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum resultado encontrado</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setFilters({ search: '', category: 'Todos', type: 'all', condition: 'all' })}
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
