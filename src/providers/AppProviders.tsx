import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Concentra todos os providers globais (Auth, Router, etc.).
 * Mudamos de BrowserRouter para HashRouter para garantir compatibilidade total 
 * com o deploy na Vercel e evitar erros de rota 404 em navegação direta.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HashRouter>
        {children}
      </HashRouter>
    </AuthProvider>
  );
}
