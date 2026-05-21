import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { registerTraffic } from './services/traffic';

import {
  Home,
  Advertise,
  Login,
  Register,
  AdDetails,
  CreateAd,
  EditAd,
  Search,
  MyAds,
  Profile,
  EditProfile,
  Favorites,
  ChatList,
  ChatWindow,
  MapView,
  AdminDashboard,
  CreateExternalAd
} from './pages';

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const didRegisterTraffic = useRef(false);

  useEffect(() => {
    if (didRegisterTraffic.current) return;

    didRegisterTraffic.current = true;
    registerTraffic();
  }, []);

  // Handle post-OAuth redirect
  useEffect(() => {
    if (user) {
      const next = localStorage.getItem('auth_redirect_next');
      if (next) {
        localStorage.removeItem('auth_redirect_next');
        // Only redirect if we are not already on a specific page 
        // (to avoid interfering with intentional navigation)
        if (window.location.pathname === '/' || window.location.pathname === '/login') {
          navigate(next, { replace: true });
        }
      }
    }
  }, [user, navigate]);

  // Stability mechanism for Supabase Auth Lock conflicts
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || "";
      
      if (
        message.includes('Lock') ||
        message.includes('stole it') ||
        message.includes('auth-token') ||
        message.includes('NavigatorLockAcquireTimeoutError') ||
        message.includes('Refresh Token Not Found') ||
        message.includes('invalid_refresh_token')
      ) {
        console.warn('Recuperando app após erro de autenticação ou lock...');
        
        // Se for erro de refresh token, limpa o que pode estar causando loop
        if (message.includes('Refresh Token')) {
          localStorage.removeItem('tefe-market-auth');
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anunciar" element={<Advertise />} />
        <Route path="/planos" element={<Advertise />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/mapa" element={<MapView />} />
        <Route path="/anuncio/:id" element={<AdDetails />} />
        
        <Route path="/publicar" element={
          <ProtectedRoute>
            <CreateAd />
          </ProtectedRoute>
        } />

        <Route path="/editar/:id" element={
          <ProtectedRoute>
            <EditAd />
          </ProtectedRoute>
        } />
        
        <Route path="/meus-anuncios" element={
          <ProtectedRoute>
            <MyAds />
          </ProtectedRoute>
        } />

        <Route path="/favoritos" element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        } />

        <Route path="/chats" element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        } />

        <Route path="/chat/:id" element={
          <ProtectedRoute>
            <ChatWindow />
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/perfil/editar" element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/novo-anuncio" element={
          <ProtectedRoute adminOnly>
            <CreateExternalAd />
          </ProtectedRoute>
        } />
        <Route path="/admin/editar-anuncio/:id" element={
          <ProtectedRoute adminOnly>
            <EditAd />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
