import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  
  return (
    <div className="min-h-screen bg-bg flex-col font-sans mb-[64px] lg:mb-0">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <BottomNav />
      <footer className="hidden lg:flex h-10 bg-white border-t border-gray-200 items-center justify-between px-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-auto">
        <div>
          {user ? (
            <span>Conectado como <strong className="text-primary">{profile?.name || user.email}</strong></span>
          ) : (
            <span>Tefé Market • O Marketplace da Terra da Castanha</span>
          )}
        </div>
        <div>
          © {new Date().getFullYear()} • Tefé, Amazonas, Brasil
        </div>
        <div>
          Tefé, AM
        </div>
      </footer>
    </div>
  );
}
