import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminRoute() {
  const { profile, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile || !isAdmin) {
    console.warn('Proteção Admin: Acesso negado para o usuário', profile?.id);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
