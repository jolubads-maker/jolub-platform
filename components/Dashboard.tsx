/// <reference types="vite/client" />
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Ad, ChatLog, User } from '../src/types';
import EyeIcon from './icons/EyeIcon';
import PhoneVerificationModal from './PhoneVerificationModal';
import EmailVerificationModal from './EmailVerificationModal';
import { useAuthStore } from '../store/useAuthStore';

// Global State
import { useAdStore } from '../store/useAdStore';
import { useChatStore } from '../store/useChatStore';
import DashboardStats from './dashboard/DashboardStats';
import DashboardProfile from './dashboard/DashboardProfile';
import DashboardChats from './dashboard/DashboardChats';
import DashboardAds from './dashboard/DashboardAds';
import ChatView from './ChatView';
import { getAdLimitForPlan } from './PricingPage';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Global State
  const { currentUser, logout } = useAuthStore();
  const { ads } = useAdStore();
  const { chatLogs, loadUserChats, subscribeToUserChats } = useChatStore();
  const { getUserById } = useAuthStore();

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
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const selectedChat = selectedChatId ? chatLogs.get(selectedChatId) : null;
  const [chatPartner, setChatPartner] = useState<User | undefined>(undefined);
  const [relevantUsers, setRelevantUsers] = useState<User[]>([]);

  // Derived State
  const userAds = useMemo(() => {
    if (!currentUser) return [];
    const currentUid = String(currentUser.providerId || currentUser.uid || currentUser.id);
    return ads.filter(ad => String(ad.sellerId) === currentUid);
  }, [ads, currentUser]);

  const userChats = useMemo(() => {
    if (!currentUser) return [];
    const currentUid = String(currentUser.providerId || currentUser.uid || currentUser.id);
    return Array.from(chatLogs.values()).filter(log =>
      (log as ChatLog).participantIds.some(id => String(id) === currentUid)
    );
  }, [chatLogs, currentUser]);

  // Fetch users for chat list
  useEffect(() => {
    const loadRelevantUsers = async () => {
      if (!userChats.length) return;

      const currentUid = String(currentUser.providerId || currentUser.uid || currentUser.id);
      const uniqueUserIds = new Set<string>();
      userChats.forEach(chat => {
        chat.participantIds.forEach(id => {
          const idStr = String(id);
          if (idStr !== currentUid) uniqueUserIds.add(idStr);
        });
      });

      const fetchedUsers: User[] = [];
      for (const id of uniqueUserIds) {
        const user = await getUserById(id);
        if (user) fetchedUsers.push(user);
      }
      setRelevantUsers(fetchedUsers);
    };

    loadRelevantUsers();
  }, [userChats, currentUser, getUserById]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      const currentUid = String(currentUser.providerId || currentUser.uid || currentUser.id);
      const partnerId = selectedChat.participantIds.find(id => String(id) !== currentUid);
      if (partnerId) {
        getUserById(partnerId).then(setChatPartner);
      } else {
        setChatPartner(undefined);
      }
    }
  }, [selectedChat, currentUser, getUserById]);

  // Subscribe to chats in real-time
  useEffect(() => {
    if (!currentUser) return;
    const currentUid = String(currentUser.providerId || currentUser.uid || currentUser.id);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserChats(currentUid);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [currentUser, subscribeToUserChats]);

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

  const handleLogout = async () => {
    console.log('Logout initiated');
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/');
  };

  const handlePhoneVerified = async (phoneNumber: string) => {
    // Phone verification no longer used with Firebase
    console.log('Phone verified:', phoneNumber);
    setShowPhoneVerifyModal(false);
  };

  const handleEmailVerified = async () => {
    // Email verification is handled by Firebase Auth
    console.log('Email verified');
    setShowEmailVerifyModal(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative overflow-hidden">

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
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${currentUser.isOnline ? 'bg-green-500' : 'bg-[#363636]'}`} />
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

          {/* 1. PERFIL */}
          <DashboardProfile currentUser={currentUser} />

          {/* TARJETA PLAN Y PROGRESO */}
          {(() => {
            const userPlan = currentUser.subscriptionPlan || 'free';
            const adLimit = getAdLimitForPlan(userPlan);
            const usedAds = userAds.length;
            const progressPercent = Math.min((usedAds / adLimit) * 100, 100);
            const isAlmostFull = progressPercent >= 80;
            const isFull = progressPercent >= 100;

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] flex flex-col"
              >
                {/* Header con Plan y Botón */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userPlan === 'free' ? 'bg-gray-100' :
                        userPlan === 'basic' ? 'bg-blue-100' :
                          userPlan === 'pro' ? 'bg-purple-100' : 'bg-amber-100'
                      }`}>
                      <span className="text-xl">
                        {userPlan === 'free' ? '🆓' :
                          userPlan === 'basic' ? '📦' :
                            userPlan === 'pro' ? '⭐' : '🏢'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Tu Plan</span>
                      <h4 className="text-lg font-black text-gray-800 capitalize">{userPlan === 'free' ? 'Gratis' : userPlan}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-1"
                  >
                    🚀 Mejorar
                  </button>
                </div>

                {/* Barra de Progreso */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Anuncios Activos</span>
                    <span className={`text-sm font-bold ${isFull ? 'text-red-500' : isAlmostFull ? 'text-orange-500' : 'text-gray-800'}`}>
                      {usedAds} / {adLimit}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${isFull ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          isAlmostFull ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                    />
                  </div>

                  {/* Mensaje de Estado */}
                  <div className="mt-3 flex items-center gap-2">
                    {isFull ? (
                      <>
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-red-500 font-medium">Límite alcanzado - Mejora tu plan</span>
                      </>
                    ) : isAlmostFull ? (
                      <>
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-xs text-orange-500 font-medium">Quedan {adLimit - usedAds} anuncios disponibles</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-gray-500">Tienes {adLimit - usedAds} anuncios disponibles</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* 2 & 3. STATS */}
          <DashboardStats points={currentUser.points} adsCount={userAds.length} />

          {/* 4. MIS ANUNCIOS */}
          <DashboardAds
            userAds={userAds}
            currentUser={currentUser}
            onSelectAd={setSelectedAd}
            onHighlightAd={handleHighlight}
            onVerifyEmail={() => setShowEmailVerifyModal(true)}
          />

          {/* 5. MIS CHATS */}
          <DashboardChats
            userChats={userChats}
            currentUser={currentUser}
            users={relevantUsers}
            onSelectChat={setSelectedChatId}
            onBlockUser={(user) => {
              if (window.confirm(`¿Estás seguro de bloquear a ${user.name}?`)) {
                alert('Función de bloqueo en proceso de conexión con backend.');
              }
            }}
            onVerifyEmail={() => setShowEmailVerifyModal(true)}
          />
        </div>
      </div>

      {/* AD LIGHTBOX MODAL */}
      <AnimatePresence>
        {
          selectedAd && (
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
          )
        }
      </AnimatePresence >

      {/* HIGHLIGHT AD MODAL */}
      <AnimatePresence>
        {
          highlightAd && (
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
                                description: `Destacar anuncio ${highlightAd.title} por ${highlightDuration} días`,
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          if (actions.order) {
                            const details = await actions.order.capture();
                            // Aquí llamarías a tu backend para confirmar el pago y destacar el anuncio
                            console.log("Pago completado:", details);
                            alert("¡Pago exitoso! Tu anuncio ha sido destacado.");
                            setHighlightAd(null);
                          }
                        }}
                      />
                    </PayPalScriptProvider>
                    <button
                      onClick={() => setHighlightAd(null)}
                      className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence>

      {/* CHAT LIGHTBOX */}
      <AnimatePresence>
        {selectedChatId && (
          chatPartner ? (
            <ChatView
              seller={chatPartner}
              buyer={currentUser}
              onBack={() => setSelectedChatId(null)}
              chatLog={selectedChat || undefined}
              onClose={() => setSelectedChatId(null)}
              ad={selectedChat?.ad}
              isOverlay={true}
            />
          ) : (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6e0ad6]"></div>
            </div>
          )
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {showPhoneVerifyModal && (
          <PhoneVerificationModal
            onPhoneVerified={handlePhoneVerified}
            onClose={() => setShowPhoneVerifyModal(false)}
          />
        )}
      </AnimatePresence>

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
