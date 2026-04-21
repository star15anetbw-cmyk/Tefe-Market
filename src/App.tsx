import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
  Favorites,
  ChatList,
  ChatWindow,
  MapView
} from './pages';

const AdminPanel = () => <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest bg-white rounded-xl shadow-lg m-4 border border-gray-100 italic">Área Administrativa (Em breve)</div>;

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
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

        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
