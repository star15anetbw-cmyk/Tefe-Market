import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchFavorites } from '../services/favorites';
import { Favorite } from '../types';
import AdCard from '../components/AdCard';
import { Heart, PackageOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFavorites(user.id);
      setFavorites(data);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      setError(err.message || 'Não foi possível carregar seus favoritos.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-10 bg-gray-100 rounded-xl w-1/3 mb-8"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="bg-white rounded-3xl aspect-[4/6] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="w-full aspect-[4/5] bg-gray-100"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-100 rounded-full w-2/3"></div>
              <div className="h-2 bg-gray-50 rounded-full w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="bg-red-50 text-red-500 p-8 rounded-[2rem] inline-block mb-6">
        <Heart className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Ops! Algo deu errado</h2>
      <p className="text-gray-500 mb-8">{error}</p>
      <Button onClick={loadFavorites} className="rounded-2xl px-10">Tentar Novamente</Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Meus Favoritos</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-l-2 border-primary pl-2 mt-1">
            {favorites.length} anúncios favoritados
          </p>
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {favorites.map((fav) => (
            fav.ad && <AdCard key={fav.ad_id} ad={fav.ad} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <div className="bg-gray-50 p-10 rounded-full mb-6 relative">
            <Heart className="w-12 h-12 text-gray-200" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold">0</div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Vazio por aqui</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-medium">
            Você ainda não favoritou nenhum anúncio. Explore as ofertas e guarde as que mais gostar!
          </p>
          <Link to="/">
            <Button className="rounded-2xl px-10">Explorar Ofertas</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
