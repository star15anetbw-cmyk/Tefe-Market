import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, MessageSquare, User, Plus, LayoutGrid, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNav() {
  const { isAdmin } = useAuth();
  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Buscar', path: '/buscar' },
    { icon: Shield, label: 'Admin', path: '/admin', adminOnly: true },
    { icon: LayoutGrid, label: 'Anúncios', path: '/meus-anuncios' },
    { icon: User, label: 'Perfil', path: '/perfil' },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-1 py-1 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className={cn(
        "flex justify-between items-center mx-auto gap-0",
        isAdmin ? "max-w-2xl" : "max-w-lg"
      )}>
        {/* Primeiros itens (metade) */}
        {visibleItems.slice(0, Math.ceil(visibleItems.length / 2)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            state={item.path === '/' ? { resetHome: Date.now() } : undefined}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center gap-0.5 transition-all py-1",
              isActive 
                ? (item.path === '/admin' ? "text-red-600 scale-105" : "text-primary scale-105") 
                : "text-gray-300"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tight truncate w-full text-center">{item.label}</span>
          </NavLink>
        ))}

        {/* Botão Central de Publicação */}
        <div className="flex-1 flex justify-center -mt-6">
          <Link to="/publicar" className="group">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 8px 15px -5px rgba(249, 115, 22, 0.4)",
                  "0 12px 25px -5px rgba(249, 115, 22, 0.6)",
                  "0 8px 15px -5px rgba(249, 115, 22, 0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center justify-center bg-gradient-to-tr from-orange-600 to-amber-500 text-white w-12 h-12 rounded-full shadow-xl border-[2px] border-white group-hover:scale-110 transition-transform"
            >
              <Plus className="w-5 h-5 font-black stroke-[3px]" />
              <span className="text-[5px] font-black uppercase tracking-tighter -mt-0.5">Postar</span>
            </motion.div>
          </Link>
        </div>

        {/* Segundos itens (outra metade) */}
        {visibleItems.slice(Math.ceil(visibleItems.length / 2)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center gap-0.5 transition-all py-1",
              isActive 
                ? (item.path === '/admin' ? "text-red-600 scale-105" : "text-primary scale-105") 
                : "text-gray-300"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tight truncate w-full text-center">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
