import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShoppingBag, User, LogOut, PlusCircle, Search, Heart, MessageSquare } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 w-full bg-primary text-white border-b-4 border-secondary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic leading-none">
                Tefé<span className="text-secondary">Market</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/publicar" 
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md font-bold hover:bg-orange-600 transition-all shadow-sm active:scale-95 text-xs uppercase"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Anunciar Grátis</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link 
                  to="/favoritos" 
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  title="Meus Favoritos"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link 
                  to="/chats" 
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  title="Minhas Conversas"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link 
                  to="/meus-anuncios" 
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  title="Meus Anúncios"
                >
                  <User className="h-5 w-5" />
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="px-2 py-1 text-[10px] font-black bg-white/10 text-white rounded border border-white/20 uppercase tracking-wider hidden sm:block"
                  >
                    Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-2 bg-white/10 text-white border border-white/30 font-bold rounded-md hover:bg-white/20 transition-all text-sm"
              >
                Minha Conta
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
