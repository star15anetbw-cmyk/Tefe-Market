import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShoppingBag, User, LogOut, PlusCircle, Search, Heart, MessageSquare, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center">
            <Link 
              to="/" 
              state={{ resetHome: Date.now() }}
              className="flex items-center gap-2 group transition-transform active:scale-95"
            >
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none flex items-center">
                  <span className="text-primary">TEFÉ</span>
                  <span className="text-secondary ml-1">MARKET</span>
                </span>
                <span className="text-[8px] font-bold text-gray-400 tracking-[0.3em] -mt-0.5 leading-none">O MARKETPLACE OFICIAL</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link 
              to="/publicar" 
              className="hidden lg:flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Anunciar Grátis</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link 
                  to="/favoritos" 
                  className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                  title="Meus Favoritos"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link 
                  to="/meus-anuncios" 
                  className="hidden sm:flex items-center gap-2 p-2 text-gray-400 hover:text-primary transition-all"
                  title="Meus Anúncios"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 px-4 py-2 text-[10px] sm:text-xs font-black bg-red-50 text-red-600 rounded-xl border border-red-100 uppercase tracking-wider hover:bg-red-100 transition-all shadow-sm active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Dashboard Admin</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="px-6 py-2.5 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition-all text-xs uppercase tracking-widest shadow-lg shadow-gray-900/10 active:scale-95"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
