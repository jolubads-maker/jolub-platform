/// <reference types="vite/client" />
import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Ad, ChatLog } from '../types';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Global State
  const { currentUser, logout, updateUserStatus, updateUserPhone, updateUserEmail } = useAuthStore();
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

  const handleLogout = async () => {
    const confirmed = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (!confirmed) return;

    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-4xl font-black text-white tracking-tighter">JOLUB</h1>
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
        <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight drop-shadow-sm">
            Bienvenido a tu centro de control
          </h2>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 1. PERFIL */}
          <motion.div
            layoutId="profile-card"
            className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#6e0ad6] to-[#4a0099] rounded-[2rem] p-6 relative overflow-hidden group shadow-[0_20px_50px_-12px_rgba(110,10,214,0.5)] hover:shadow-[0_20px_60px_-12px_rgba(110,10,214,0.7)] transition-all duration-500 flex items-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-700" />
            <div className="absolute top-6 right-6 inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/80 backdrop-blur-md">
              ID: {currentUser.uniqueId || `USER-${currentUser.id}`}
            </div>
            <div className="relative z-10 flex flex-row items-center gap-6 w-full">
              <div className="relative flex-shrink-0 cursor-pointer group/avatar" onClick={handleAvatarClick}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-50" />
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className={`relative w-24 h-24 rounded-full border-4 border-white/20 object-cover shadow-2xl transition-all duration-300 group-hover/avatar:border-white/50 group-hover/avatar:scale-105 ${isUploadingAvatar ? 'opacity-50 grayscale' : ''}`}
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/30 rounded-full">
                    <span className="text-white text-xs font-bold">Cambiar</span>
                  </div>
                )}
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#5b00b3] ${currentUser.isOnline ? 'bg-green-400' : 'bg-gray-400'} z-30`} />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg">{currentUser.name}</h1>
                <div className="flex flex-col gap-2 mt-2">
                  {currentUser.emailVerified ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                      </svg>
                      <span className="text-sm font-bold tracking-wide drop-shadow-sm">Email Verificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                      </svg>
                      <span className="text-sm font-bold">Email Pendiente</span>
                    </div>
                  )}
                  {currentUser.phoneVerified ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 5.25V4.5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bold tracking-wide drop-shadow-sm">Teléfono Verificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 5.25V4.5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bold">Teléfono Pendiente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. STATS: PUNTOS */}
          <motion.div
            whileHover={{ y: -5 }}
            className="col-span-1 bg-gradient-to-br from-[#6e0ad6] to-[#4a0099] rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(110,10,214,0.4)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl text-yellow-300 backdrop-blur-sm">
                <StarIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-white/90 text-lg">Reputación</span>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2 drop-shadow-md">{currentUser.points}</div>
              <div className="w-full bg-black/30 rounded-full h-2 mt-2 overflow-hidden backdrop-blur-sm">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${Math.min((currentUser.points / 1000) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-white/60 mt-3 font-medium uppercase tracking-wider">Puntos de confianza</p>
            </div>
          </motion.div>

          {/* 3. STATS: ANUNCIOS */}
          <motion.div
            whileHover={{ y: -5 }}
            className="col-span-1 bg-gradient-to-br from-[#6e0ad6] to-[#4a0099] rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(110,10,214,0.4)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl text-blue-300 backdrop-blur-sm">
                <EyeIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-white/90 text-lg">Anuncios</span>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2 drop-shadow-md">{userAds.length}</div>
              <p className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wider">Activos en el mercado</p>
            </div>
          </motion.div>

          {/* 4. VERIFICACIONES (Removed old inline verifications) */}

          {/* 5. MIS ANUNCIOS */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[400px]">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-3 h-8 bg-[#6e0ad6] rounded-full shadow-[0_0_15px_rgba(110,10,214,0.5)]" />
              Mis Publicaciones
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {userAds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userAds.map(ad => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      seller={currentUser}
                      onSelect={() => setSelectedAd(ad)}
                      currentUser={currentUser}
                      onToggleFavorite={() => { }}
                      variant="dashboard"
                      onHighlight={handleHighlight}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
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
          </div>

          {/* 6. MIS CHATS */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[400px]">
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
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => {
                        const otherId = chat.participantIds.find(id => id !== currentUser.id);
                        if (otherId) {
                          const chatId = [currentUser.id, otherId].sort().join('-');
                          navigate(`/chat/${chatId}`, { state: { sellerId: otherId, buyerId: currentUser.id } });
                        }
                      }}
                    >
                      <UserStatusBadge
                        avatar={otherUser.avatar}
                        name={otherUser.name}
                        isOnline={otherUser.isOnline}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-[#6e0ad6] transition-colors">{otherUser.name}</h4>
                        <p className="text-sm text-gray-500 truncate font-medium">Haz clic para abrir chat</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-full text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
                        <MessageIcon className="w-5 h-5" />
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

      {/* PHONE VERIFICATION MODAL */}
      <AnimatePresence>
        {showPhoneVerifyModal && (
          <PhoneVerificationModal
            onPhoneVerified={handlePhoneVerified}
            onClose={() => setShowPhoneVerifyModal(false)}
          />
        )}
      </AnimatePresence>

      {/* EMAIL VERIFICATION MODAL */}
      <AnimatePresence>
        {showEmailVerifyModal && (
          <EmailVerificationModal
            currentUser={currentUser}
            onEmailVerified={handleEmailVerified}
            onClose={() => setShowEmailVerifyModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;