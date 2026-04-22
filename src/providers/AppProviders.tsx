import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Concentra todos os providers globais (Auth, Router, etc.).
 * Utilizamos BrowserRouter para suportar URLs amigáveis e fluxos de autenticação 
 * baseados em redirecionamento (OAuth/PKCE).
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </AuthProvider>
  );
}
