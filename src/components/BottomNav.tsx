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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-4 py-2 pb-4 sm:pb-2 z-[100] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex justify-between items-center max-w-2xl mx-auto gap-2">
        {visibleItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            state={item.path === '/' ? { resetHome: Date.now() } : undefined}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center gap-1 transition-all py-1 rounded-2xl",
              isActive ? "text-primary" : "text-gray-400"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-6 h-6 shrink-0 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Central Plus Button */}
        <Link to="/publicar" className="relative -top-6">
           <motion.div
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 border-4 border-white"
           >
             <Plus className="w-8 h-8 font-black" />
           </motion.div>
        </Link>

        {visibleItems.slice(-2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center gap-1 transition-all py-1 rounded-2xl",
              isActive ? "text-primary" : "text-gray-400"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-6 h-6 shrink-0 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
