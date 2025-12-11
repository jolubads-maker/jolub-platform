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
import { getSocketUrl } from '../config/api.config';

// Global State
import { useAdStore } from '../store/useAdStore';
import { useChatStore } from '../store/useChatStore';
import DashboardStats from './dashboard/DashboardStats';
import DashboardProfile from './dashboard/DashboardProfile';
import DashboardChats from './dashboard/DashboardChats';
import DashboardAds from './dashboard/DashboardAds';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Global State
  const { currentUser, logout, updateUserPhone, updateUserEmail } = useAuthStore();
  const { ads } = useAdStore();
  const { chatLogs } = useChatStore();
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
    return ads.filter(ad => ad.sellerId === currentUser.id);
  }, [ads, currentUser]);

  const userChats = useMemo(() => {
    if (!currentUser) return [];
    return Array.from(chatLogs.values()).filter(log =>
      (log as ChatLog).participantIds.includes(currentUser.id)
    );
  }, [chatLogs, currentUser]);

  // Fetch users for chat list
  useEffect(() => {
    const loadRelevantUsers = async () => {
      if (!userChats.length) return;

      const uniqueUserIds = new Set<number>();
      userChats.forEach(chat => {
        chat.participantIds.forEach(id => {
          if (id !== currentUser.id) uniqueUserIds.add(id);
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
  }, [userChats, currentUser.id, getUserById]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      const partnerId = selectedChat.participantIds.find(id => id !== currentUser.id);
      if (partnerId) {
        getUserById(partnerId).then(setChatPartner);
      } else {
        setChatPartner(undefined);
      }
    }
  }, [selectedChat, currentUser, getUserById]);

  // Listen for new messages to update chat list
  useEffect(() => {
    if (!currentUser) return;

    const socketUrl = getSocketUrl();
    import('socket.io-client').then(({ io }) => {
      const socket = io(socketUrl, {
        transports: ['websocket'],
        auth: { token: currentUser.sessionToken }
      });

      socket.on('new_message_notification', (data) => {
        console.log('🔔 Dashboard: Nueva notificación recibida, actualizando chats...', data);
        // Reload chats to update order and unread status
        useChatStore.getState().loadUserChats(currentUser.id);
      });

      return () => {
        socket.disconnect();
      };
    });
  }, [currentUser]);

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
