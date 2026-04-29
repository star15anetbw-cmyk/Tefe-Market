import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import {
  Home,
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
  AuthCallback,
  MapView,
  AdminDashboard
} from './pages';

export default function App() {
  useEffect(() => {
    const handleFocus = () => {
      // Quando o app ganha foco (ex: volta do WhatsApp),
      // garantimos que não estamos em um estado quebrado.
      // Não fazemos getSession ou refresh manual aqui para evitar conflitos de sessão (Lock).
      console.log('App focused');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
