import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Concentrates all global providers (Auth, Router, etc.) to keep the entry points clean.
 * The order of nesting follows the dependency chain (Router depends on logic provided 
 * by Auth in some cases, though here they are relatively independent).
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
