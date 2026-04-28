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
              className="hidden lg:flex flex-col items-center group"
            >
              <div className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-secondary to-orange-500 text-white rounded-xl font-black hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest border-b-4 border-orange-700">
                <PlusCircle className="h-4 w-4" />
                <span>Anunciar Grátis</span>
              </div>
              <span className="text-[9px] font-bold text-white/50 mt-1 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                Leva menos de 1 minuto
              </span>
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
                {/* Chat interno desativado temporariamente para o MVP
                <Link 
                  to="/chats" 
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  title="Minhas Conversas"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                */}
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
