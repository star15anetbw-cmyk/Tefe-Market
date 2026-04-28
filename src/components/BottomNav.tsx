import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, MessageSquare, User, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Buscar', path: '/buscar' },
    // { icon: MessageSquare, label: 'Chats', path: '/chats' }, // Desativado temporariamente para o MVP
    { icon: User, label: 'Perfil', path: '/perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-lg mx-auto gap-1">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center gap-1 transition-all",
              isActive ? "text-primary scale-110" : "text-gray-300 hover:text-gray-500"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}

        {/* Central Circular High-Conversion Button */}
        <div className="flex-1 flex justify-center -mt-4">
          <Link to="/publicar" className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0px rgba(255, 106, 0, 0)",
                  "0 0 15px rgba(255, 106, 0, 0.4)",
                  "0 0 0px rgba(255, 106, 0, 0)"
                ]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center justify-center bg-[#FF6A00] text-white w-12 h-12 rounded-full shadow-lg border-2 border-white"
            >
              <Plus className="w-5 h-5 font-black stroke-[3px]" />
              <span className="text-[6px] font-black uppercase tracking-tighter -mt-0.5">Anunciar</span>
            </motion.div>
          </Link>
        </div>

        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center gap-1 transition-all",
              isActive ? "text-primary scale-110" : "text-gray-300 hover:text-gray-500"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
