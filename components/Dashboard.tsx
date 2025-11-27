/// <reference types="vite/client" />
import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Ad, ChatLog } from '../src/types';
import AdCard from './AdCard';
import StarIcon from './icons/StarIcon';
import MessageIcon from './icons/MessageIcon';
import EyeIcon from './icons/EyeIcon';
import PhoneVerificationModal from './PhoneVerificationModal';
import EmailVerificationModal from './EmailVerificationModal';
import { useAuthStore } from '../store/useAuthStore';
import { useAdStore } from '../store/useAdStore';
import { useChatStore } from '../store/useChatStore';
import { apiService } from '../services/apiService';
import UserStatusBadge from './UserStatusBadge';
import ChatView from './ChatView';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Global State
  const { currentUser, logout, updateUserStatus, updateUserPhone, updateUserEmail, togglePrivacy } = useAuthStore();
  const { ads, incrementViews } = useAdStore();
  const { chatLogs } = useChatStore();
  const { users } = useAuthStore();

  // Local State
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  // Highlight Ad State
  const [highlightAd, setHighlightAd] = useState<Ad | null>(null);
  const [highlightDuration, setHighlightDuration] = useState('1');
  const [highlightTermsAccepted, setHighlightTermsAccepted] = useState(false);

  // Email Verification Modal State
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  // Phone Verification Modal State
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);

  // Chat Lightbox State
  const [selectedChat, setSelectedChat] = useState<ChatLog | null>(null);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived State
  const userAds = useMemo(() => {
    if (!currentUser) return [];
    return ads.filter(ad => ad.sellerId === currentUser.id);
  }, [ads, currentUser]);

  const userChats = useMemo(() => {
    if (!currentUser) return [];
    return Array.from(chatLogs.values()).filter(log =>
      (log as ChatLog).participantIds.includes(currentUser.id)
    );
  }, [chatLogs, currentUser]);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const closeLightbox = () => {
    setSelectedAd(null);
    setSelectedMediaIndex(0);
  };

  const handleHighlight = (ad: Ad) => {
    setHighlightAd(ad);
    setHighlightDuration('1');
    setHighlightTermsAccepted(false);
  };

  const goPrevMedia = () => {
    if (!selectedAd) return;
    const total = selectedAd.media.length;
    setSelectedMediaIndex((idx) => (idx - 1 + total) % total);
  };

  const goNextMedia = () => {
    if (!selectedAd) return;
    const total = selectedAd.media.length;
    setSelectedMediaIndex((idx) => (idx + 1) % total);
  };

  const getOtherParticipant = (chat: ChatLog) => {
    const otherId = chat.participantIds.find(id => id !== currentUser.id);
    return users.find(user => user.id === otherId);
  };

  const handleLogout = () => {
    // const confirmed = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
    // if (!confirmed) return;
    console.log('Logout initiated');

    // 1. Clear Local Storage immediately
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('phoneVerification');

    // 2. Call API in background (fire and forget)
    // We don't await this because we want immediate UI feedback
    logout().catch(err => console.error('Background logout error:', err));

    // 3. Force Hard Redirect to Home
    window.location.href = '/';
  };

  // Avatar Upload Logic
  const CLOUDINARY_CLOUD_NAME = 'dim5dxlil';
  const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      const newAvatarUrl = data.secure_url;

      // Update in Backend
      await apiService.createOrUpdateUser({
        ...currentUser,
        avatar: newAvatarUrl
      });

      // Update in Store (Optimistic or re-fetch)
      // For now, we rely on createOrUpdateUser returning the updated user 
      // but we should probably call a store action to update it locally
      useAuthStore.setState(state => ({
        currentUser: { ...state.currentUser!, avatar: newAvatarUrl }
      }));

      alert('Avatar actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando avatar:', error);
      alert(`Error: ${error.message || 'No se pudo actualizar la imagen'}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePhoneVerified = async (phoneNumber: string) => {
    try {
      await updateUserPhone(phoneNumber);
      setShowPhoneVerifyModal(false);
    } catch (error) {
      console.error('Error updating phone in store:', error);
    }
  };

  const handleEmailVerified = async () => {
    try {
      await updateUserEmail();
      setShowEmailVerifyModal(false);
    } catch (error) {
      console.error('Error updating email in store:', error);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = 240;
      const gap = 24; // gap-6
      const scrollAmount = (cardWidth + gap) * 4; // Scroll 4 items
      const newScrollLeft = direction === 'left'
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#6e0ad6] shadow-lg mb-8">
        <div className="container mx-auto px-10 md:px-40 h-20 flex items-center justify-between gap-8">
          <div className="flex-shrink-0 cursor-pointer flex items-center gap-1" onClick={() => navigate('/')}>
            <div className="w-12 h-12 bg-[#ea580c] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-3xl">J</span>
            </div>
            <span className="text-white font-black text-2xl tracking-widest mx-1">OLU</span>
            <div className="w-12 h-12 bg-[#ea580c] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-3xl">B</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-white font-semibold ml-auto">
            <button onClick={() => navigate('/')} className="hover:text-gray-200 transition-colors">
              Inicio
            </button>
            <div className="flex items-center gap-3 cursor-pointer group relative">
              <span className="hidden lg:block truncate max-w-[100px]">{currentUser.name}</span>
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:border-white transition-all"
                />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${currentUser.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12 relative">
        <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight drop-shadow-sm">
            Bienvenido a tu centro de control
          </h2>

          {/* ID Badge */}
          <div className="py-1.5 px-4 rounded-lg bg-[#ea580c] text-xs font-bold text-white shadow-lg cursor-pointer hover:bg-[#d9520b] transition-colors flex items-center gap-2"
            onClick={() => navigator.clipboard.writeText(currentUser.uniqueId || `USER-${currentUser.id}`)}>
            <span>ID: {currentUser.uniqueId || `USER-${currentUser.id}`}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 1. PERFIL (Purple & Bento) */}
          <motion.div
            layoutId="profile-card"
            className="col-span-1 md:col-span-2 bg-[#6e0ad6] rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl min-h-[200px] flex flex-col justify-center"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 pl-4">

              {/* Avatar (Left) */}
              <div className="relative group/avatar cursor-pointer flex-shrink-0" onClick={handleAvatarClick}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-50 group-hover/avatar:opacity-80 transition-opacity" />
                <img
                  src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name) + "&background=random"}
                  alt={currentUser.name}
                  className="relative w-32 h-32 rounded-full border-4 border-white/20 object-cover shadow-2xl transition-transform duration-300 group-hover/avatar:scale-105 bg-gray-800"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name) + "&background=random";
                  }}
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 rounded-full">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#1a1a1a] rounded-full flex items-center justify-center z-20 border-2 border-[#6e0ad6]">
                  <div className={`w-3 h-3 rounded-full ${currentUser.isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-500'}`} />
                </div>
              </div>

              {/* Info (Middle) */}
              <div className="flex flex-col items-center md:items-start gap-1 flex-1 pt-2">
                <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md mb-0.5">{currentUser.name}</h1>
                <p className="text-white/80 text-sm font-medium mb-4">
                  Miembro desde {new Date(currentUser.createdAt || Date.now()).getFullYear()}
                </p>

                {/* Contact List - Horizontal Row */}
                <div className="flex flex-wrap items-center gap-8 w-full">

                  {/* Email Row */}
                  <div className="flex items-center gap-3 h-8">
                    <div className="text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    {currentUser.emailVerified ? (
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-base">
                          {currentUser.showEmail ? currentUser.email : 'Confirmado'}
                        </span>
                        <button
                          onClick={() => togglePrivacy('showEmail')}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-out focus:outline-none shadow-inner ${currentUser.showEmail ? 'bg-green-500' : 'bg-black/40 border border-white/10'}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${currentUser.showEmail ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    ) : (
                      <span className="text-white font-bold text-base">No verificado</span>
                    )}
                  </div>

                  {/* Phone Row */}
                  <div className="flex items-center gap-3 h-8">
                    <div className="text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    {currentUser.phoneVerified ? (
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-base">
                          {currentUser.showPhone ? currentUser.phone : 'Confirmado'}
                        </span>
                        <button
                          onClick={() => togglePrivacy('showPhone')}
                          className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-out focus:outline-none shadow-inner ${currentUser.showPhone ? 'bg-green-500' : 'bg-black/40 border border-white/10'}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${currentUser.showPhone ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    ) : (
                      <span className="text-white font-bold text-base">No verificado</span>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. STATS: PUNTOS */}
          <motion.div
            className="col-span-1 bg-[#6e0ad6] rounded-[2rem] p-6 flex flex-col justify-center relative overflow-hidden shadow-2xl min-h-[200px]"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex items-start gap-4">
              <div className="p-2 bg-[#ea580c] rounded-full text-white shadow-lg flex-shrink-0 mt-1">
                <StarIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-2xl mb-1">Reputación</span>
                <div className="text-5xl font-black text-white drop-shadow-md mb-1">{currentUser.points}</div>
                <p className="text-sm text-white/80 font-medium">Puntos de confianza</p>
              </div>
            </div>
          </motion.div>

          {/* 3. STATS: ANUNCIOS */}
          <motion.div
            className="col-span-1 bg-[#6e0ad6] rounded-[2rem] p-6 flex flex-col justify-center relative overflow-hidden shadow-2xl min-h-[200px]"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex items-start gap-4">
              <div className="p-2 bg-[#ea580c] rounded-full text-white shadow-lg flex-shrink-0 mt-1">
                <EyeIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-2xl mb-1">Anuncios</span>
                <div className="text-5xl font-black text-white drop-shadow-md mb-1">{userAds.length}</div>
                <p className="text-sm text-white/80 font-medium">Activos en el mercado</p>
              </div>
            </div>
          </motion.div>

          {/* 4. VERIFICACIONES (Removed old inline verifications) */}

          {/* 5. MIS ANUNCIOS (CAROUSEL) */}
          <div className="col-span-1 md:col-span-4 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[450px] relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <span className="w-3 h-8 bg-[#6e0ad6] rounded-full shadow-[0_0_15px_rgba(110,10,214,0.5)]" />
                Mis Publicaciones
              </h3>
              {currentUser.phoneVerified && userAds.length > 0 && (
                <button
                  onClick={() => navigate('/publicar')}
                  className="bg-[#ea580c] hover:bg-[#d9520b] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-md flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Crear Anuncio
                </button>
              )}
            </div>

            <div className="relative flex-1 group/carousel">
              {/* Left Arrow */}
              {userAds.length > 4 && (
                <button
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-[#6e0ad6] text-white p-3 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-[#5b08b0]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Carousel Container */}
              <div
                ref={carouselRef}
                className={`flex gap-6 overflow-x-auto pb-8 pt-2 px-2 scroll-smooth snap-x snap-mandatory hide-scrollbar h-full items-center ${userAds.length <= 4 ? 'justify-center' : ''}`}
              >
                {userAds.length > 0 ? (
                  userAds.map(ad => (
                    <div key={ad.id} className="min-w-[240px] max-w-[240px] snap-center">
                      <AdCard
                        ad={ad}
                        seller={currentUser}
                        onSelect={() => setSelectedAd(ad)}
                        currentUser={currentUser}
                        onToggleFavorite={() => { }}
                        variant="dashboard"
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 opacity-80 min-h-[300px]">
                    {!currentUser.phoneVerified ? (
                      <motion.div
                        onClick={() => setShowPhoneVerifyModal(true)}
                        className="w-full cursor-pointer flex flex-col items-center gap-4 group py-10"
                      >
                        <div className="transition-transform duration-300 group-hover:scale-110">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#ea580c]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <span className="text-xl font-bold text-black block mb-1">Verifica tu teléfono</span>
                          <span className="text-sm text-black font-medium">Para publicar anuncios</span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 group">
                        <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                          <EyeIcon className="w-16 h-16 text-[#ea580c]" />
                        </div>
                        <p className="font-bold text-lg text-black">No tienes anuncios activos</p>
                        <button onClick={() => navigate('/publicar')} className="mt-4 text-[#6e0ad6] font-bold hover:underline">
                          Crear uno ahora
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Arrow */}
              {userAds.length > 4 && (
                <button
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-[#6e0ad6] text-white p-3 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-[#5b08b0]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 6. MIS CHATS */}
          <div className="col-span-1 md:col-span-4 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[400px]">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-3 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              Mensajes Recientes
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {userChats.length > 0 ? (
                userChats.map((chat, index) => {
                  const otherUser = getOtherParticipant(chat);
                  if (!otherUser) return null;
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, backgroundColor: '#f8f9fa' }}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all cursor-pointer group relative"
                    >
                      <div onClick={() => {
                        const otherId = chat.participantIds.find(id => id !== currentUser.id);
                        if (otherId) {
                          const chatId = [currentUser.id, otherId].sort().join('-');
                          navigate(`/chat/${chatId}`, { state: { sellerId: otherId, buyerId: currentUser.id } });
                        }
                      }} className="flex-1 flex items-center gap-4">
                        <UserStatusBadge
                          avatar={otherUser.avatar}
                          name={otherUser.name}
                          isOnline={otherUser.isOnline}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-[#6e0ad6] transition-colors">{otherUser.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <StarIcon className="w-4 h-4 text-orange-500" />
                            <span className="font-bold text-gray-700">Reputación: {otherUser.points || 0}</span>
                          </div>
                          {/* Unread Count Logic (Mocked for now as we need full message objects in list) */}
                          {/* En una implementación real, chat.messages debería traer el conteo o los mensajes no leídos */}
                          {chat.messages && chat.messages.some((m: any) => !m.isRead && m.userId !== currentUser.id) && (
                            <p className="text-xs text-green-600 font-bold mt-1">
                              Mensajes pendientes de contestar
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Opening chat lightbox for:', chat.id);
                            setSelectedChat(chat);
                          }}
                          className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 transition-colors shadow-sm"
                        >
                          Contestar
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Estás seguro de bloquear a ${otherUser.name}?`)) {
                              // Lógica de bloqueo
                              const chatId = [currentUser.id, otherUser.id].sort().join('-');
                              // Necesitamos acceso al socket o API para bloquear.
                              // Por ahora usaremos apiService si implementamos el endpoint, o socket si tuviéramos acceso aquí.
                              // Como socket está en ChatView, lo ideal sería una acción de store o API.
                              // Vamos a asumir que existe apiService.blockChat o similar, o lo agregamos.
                              alert('Función de bloqueo en proceso de conexión con backend.');
                            }
                          }}
                          className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full hover:bg-red-200 transition-colors"
                        >
                          Bloquear
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
                  {!currentUser.emailVerified ? (
                    <motion.div
                      onClick={() => setShowEmailVerifyModal(true)}
                      className="w-full cursor-pointer flex flex-col items-center gap-4 transition-all group py-10"
                    >
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#ea580c]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-bold text-black block mb-1">Verifica tu Correo</span>
                        <span className="text-sm text-black font-medium">Necesario para chatear</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 group">
                      <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#ea580c]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <p className="font-bold text-lg text-black">No hay conversaciones</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-white/10 rounded-3xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-1 bg-black relative flex flex-col justify-center group">
                <div ref={mediaContainerRef} className="relative w-full h-full min-h-[300px] md:min-h-[500px] flex items-center justify-center bg-gray-900">
                  {selectedAd.media[selectedMediaIndex]?.type === 'image' ? (
                    <img
                      src={selectedAd.media[selectedMediaIndex]?.url}
                      alt="Detail"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={selectedAd.media[selectedMediaIndex]?.url}
                      controls
                      className="max-w-full max-h-full"
                    />
                  )}
                </div>
                {selectedAd.media.length > 1 && (
                  <>
                    <button onClick={goPrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">‹</button>
                    <button onClick={goNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">›</button>
                  </>
                )}
              </div>
              <div className="w-full md:w-[400px] p-8 bg-white/95 backdrop-blur-xl border-l border-white/5 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 leading-tight">{selectedAd.title}</h2>
                  <button onClick={closeLightbox} className="text-gray-500 hover:text-gray-800">✕</button>
                </div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#6e0ad6] to-indigo-600 mb-6">
                  ${selectedAd.price.toLocaleString()}
                </div>
                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</h4>
                    <p className="text-gray-600 leading-relaxed text-sm">{selectedAd.description}</p>
                  </div>
                  {selectedAd.details && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Detalles</h4>
                      <p className="text-gray-600 text-sm">{selectedAd.details}</p>
                    </div>
                  )}
                </div>
                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-2"><EyeIcon className="w-4 h-4" /> {selectedAd.views} Vistas</span>
                  <span>{selectedAd.location}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HIGHLIGHT AD MODAL */}
      <AnimatePresence>
        {highlightAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setHighlightAd(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#6e0ad6] p-6 flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">Destacar Anuncio</h2>
                <button onClick={() => setHighlightAd(null)} className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <div className="p-4 bg-[#6e0ad6] rounded-xl shadow-md mb-3">
                    <p className="text-xs text-white font-bold uppercase tracking-wide mb-1">ID del Anuncio</p>
                    <p className="text-lg font-mono font-bold text-white break-all">
                      #{highlightAd.uniqueCode || `AD-${highlightAd.id}`}
                    </p>
                  </div>
                  <h3 className="text-xl font-black text-black leading-tight">
                    {highlightAd.title}
                  </h3>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuánto tiempo quieres destacar?</label>
                  <div className="relative">
                    <select
                      value={highlightDuration}
                      onChange={(e) => setHighlightDuration(e.target.value)}
                      className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-800 font-bold rounded-xl py-3 px-4 pr-8 leading-tight focus:outline-none focus:border-[#6e0ad6] focus:ring-0 transition-colors"
                    >
                      <option value="1">1 día = $2.00</option>
                      <option value="3">3 días = $5.00</option>
                      <option value="7">7 días = $8.00</option>
                      <option value="15">15 días = $12.00</option>
                      <option value="30">30 días = $15.00</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="mb-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${highlightTermsAccepted ? 'bg-[#6e0ad6] border-[#6e0ad6]' : 'border-gray-300 group-hover:border-[#6e0ad6]'}`}>
                      {highlightTermsAccepted && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={highlightTermsAccepted}
                      onChange={(e) => setHighlightTermsAccepted(e.target.checked)}
                    />
                    <span className="text-sm text-gray-600 font-medium select-none">
                      Acepto las <span className="text-[#6e0ad6] hover:underline">condiciones de uso</span> y la <span className="text-[#6e0ad6] hover:underline">política de privacidad</span>.
                    </span>
                  </label>
                </div>
                <div className="flex flex-col gap-3">
                  <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      disabled={!highlightTermsAccepted}
                      createOrder={(data, actions) => {
                        let value = "2.00";
                        if (highlightDuration === "3") value = "5.00";
                        if (highlightDuration === "7") value = "8.00";
                        if (highlightDuration === "15") value = "12.00";
                        if (highlightDuration === "30") value = "15.00";

                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              amount: {
                                currency_code: "USD",
                                value: value,
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (!actions.order) return;
                        return actions.order.capture().then(async (details) => {
                          try {
                            const res = await fetch(`/api/ads/${highlightAd.id}/feature`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ durationDays: highlightDuration })
                            });

                            if (res.ok) {
                              alert("¡Pago exitoso! Tu anuncio ha sido destacado.");
                              setHighlightAd(null);
                              window.location.reload();
                            } else {
                              alert("Error al actualizar el anuncio. Por favor contacta soporte.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Error de conexión.");
                          }
                        });
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT LIGHTBOX */}
      <AnimatePresence>
        {selectedChat && (
          <ChatView
            chatLog={selectedChat}
            buyer={currentUser}
            seller={getOtherParticipant(selectedChat)!}
            onBack={() => setSelectedChat(null)}
            onSendMessage={() => { }}
            isOverlay={true}
          />
        )}
      </AnimatePresence>


      {/* PHONE VERIFICATION MODAL */}
      <AnimatePresence>
        {
          showPhoneVerifyModal && (
            <PhoneVerificationModal
              onPhoneVerified={handlePhoneVerified}
              onClose={() => setShowPhoneVerifyModal(false)}
            />
          )
        }
      </AnimatePresence >

      {/* EMAIL VERIFICATION MODAL */}
      <AnimatePresence>
        {
          showEmailVerifyModal && (
            <EmailVerificationModal
              currentUser={currentUser}
              onEmailVerified={handleEmailVerified}
              onClose={() => setShowEmailVerifyModal(false)}
            />
          )
        }
      </AnimatePresence >
    </div >
  );
};

export default Dashboard;
