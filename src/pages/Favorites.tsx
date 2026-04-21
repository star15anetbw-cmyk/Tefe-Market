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
      const data = await fetchFavorites(user.id);
      setFavorites(data);
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Carregando favoritos...</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
