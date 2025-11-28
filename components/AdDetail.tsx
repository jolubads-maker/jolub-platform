import React, { useState, useEffect } from 'react';
import { Ad, User, Media } from '../src/types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChatIcon from './icons/ChatIcon';
import EyeIcon from './icons/EyeIcon';

interface AdDetailProps {
  ad: Ad;
  seller: User;
  onBack: () => void;
  onStartChat: (sellerId: number) => void;
  currentUser: User | null;
}

const AdDetail: React.FC<AdDetailProps> = ({ ad, seller, onBack, onStartChat, currentUser }) => {
  const [activeMedia, setActiveMedia] = useState<Media | undefined>(ad.media?.[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    if (ad.media && ad.media.length > 0) {
      setActiveMedia(ad.media[0]);
      setCurrentMediaIndex(0);
    }
  }, [ad]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!ad.media) return;
    const nextIndex = (currentMediaIndex + 1) % ad.media.length;
    setCurrentMediaIndex(nextIndex);
    setActiveMedia(ad.media[nextIndex]);
  };

  const handlePrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!ad.media) return;
    const prevIndex = (currentMediaIndex - 1 + ad.media.length) % ad.media.length;
    setCurrentMediaIndex(prevIndex);
    setActiveMedia(ad.media[prevIndex]);
  };

  const renderMedia = (media: Media, isLightbox = false) => {
    if (!media) return null;
    const className = isLightbox
      ? "max-w-full max-h-full object-contain"
      : "w-full h-full object-cover cursor-pointer";

    if (media.type === 'image') {
      return (
        <img
          src={media.url}
          alt={ad.title}
          className={className}
          onClick={() => !isLightbox && setIsLightboxOpen(true)}
        />
      );
    } else {
      return (
        <video
          src={media.url}
          controls
          className={className}
        />
      );
    }
  };

  const showChatButton = currentUser && currentUser.id !== seller.id;
  const currentMedia = activeMedia || ad.media?.[0];
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notification, setNotification] = useState<{ senderName: string; text: string; chatId: string } | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const socketUrl = 'http://localhost:4000'; // Or use config
    import('socket.io-client').then(({ io }) => {
      const socket = io(socketUrl, {
        transports: ['websocket'],
        auth: { token: currentUser.sessionToken }
      });

      socket.on('connect', () => {
        console.log('🔔 AdDetail conectado a socket para notificaciones');
      });

      socket.on('new_message_notification', (data: { chatId: string; senderName: string; text: string; adId?: number }) => {
        console.log('🔔 Notificación recibida:', data);
        if (data.adId && data.adId !== ad.id) return;

        setNotification({
          senderName: data.senderName,
          text: data.text,
          chatId: data.chatId
        });

        // Auto hide after 10 seconds
        setTimeout(() => setNotification(null), 10000);
      });

      return () => {
        socket.disconnect();
      };
    });
  }, [currentUser, ad.id]);

  const handleStartChat = () => {
    if (!currentUser) {
      onStartChat(seller.id);
      return;
    }
    setIsChatOpen(true);
    setNotification(null);
  };

  return (
    <div className={`min-h-screen bg-[#6e0ad6] transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 py-8">
        {/* Header Navigation */}
        <button
          onClick={onBack}
          className="group flex items-center text-white hover:text-white/80 mb-8 transition-all duration-300 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm hover:bg-white/20"
        >
          <div className="bg-white/20 group-hover:bg-white/30 p-2 rounded-full mr-3 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-white transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="font-medium">Volver a resultados</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-8">

          {/* LEFT COLUMN: Info & Actions */}
          <div className="h-full">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/20 p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black leading-tight mb-2 text-[#6e0ad6]">
                      {ad.title}
                    </h1>
                    <div className="flex items-center text-sm gap-3">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-black font-bold">#{ad.uniqueCode}</span>
                      <span className="flex items-center text-black font-bold">
                        <EyeIcon className="w-4 h-4 mr-1" /> {ad.views} vistas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-black text-[#6e0ad6] drop-shadow-sm">
                    ${ad.price.toLocaleString()}
                  </span>
                  <span className="text-[#6e0ad6] text-xl ml-2 font-medium">USD</span>
                </div>

                {/* Seller Card */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#6e0ad6] shadow-md"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-black font-bold">Vendedor</p>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#6e0ad6]">{seller.name}</h3>
                        <div className={`w-3 h-3 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-red-500'} border border-white`} title={seller.isOnline ? 'Online' : 'Offline'}></div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold border border-orange-200">
                          {seller.points} pts
                        </span>
                        {seller.phoneVerified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center border border-green-200">
                            ✓ Verificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-auto">
                {showChatButton ? (
                  <button
                    onClick={handleStartChat}
                    disabled={!seller.isOnline}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transform transition-all duration-200 hover:-translate-y-1 flex items-center justify-center ${seller.isOnline
                      ? 'bg-[#d9520b] text-white hover:bg-[#b94509]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    <ChatIcon className="w-6 h-6 mr-2" />
                    Chat
                  </button>
                ) : !currentUser ? (
                  <button
                    onClick={() => onStartChat(seller.id)}
                    className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-black text-white shadow-lg hover:bg-gray-900 transform transition-all duration-200 hover:-translate-y-1"
                  >
                    Iniciar Sesión para Contactar
                  </button>
                ) : (
                  <div className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gray-100 text-gray-400 text-center border-2 border-dashed border-gray-300">
                    Este es tu anuncio
                  </div>
                )}

                <button className="w-full py-3 px-6 rounded-xl font-bold text-[#6e0ad6] bg-white border-2 border-[#6e0ad6]/20 hover:bg-[#6e0ad6]/5 transition-colors">
                  Guardar en Favoritos
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Media Gallery */}
          <div className="h-full">
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden h-full group border border-white/10 flex items-center justify-center">
              <div className="absolute inset-0 w-full h-full">
                {currentMedia ? renderMedia(currentMedia) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <span className="text-6xl mb-2">📷</span>
                    <p>Sin imagen</p>
                  </div>
                )}
              </div>

              {/* Carousel Arrows */}
              {ad.media && ad.media.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm z-20"
                  >
                    <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm z-20"
                  >
                    <ArrowLeftIcon className="w-6 h-6 rotate-180" />
                  </button>
                </>
              )}

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none z-10">
                <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                  {ad.category || 'General'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FULL WIDTH BOTTOM: Description & Details */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-[#6e0ad6]">Descripción</h2>
            <p className="text-[#6e0ad6] leading-relaxed whitespace-pre-line text-lg font-medium">
              {ad.description}
            </p>

            {ad.details && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-[#6e0ad6]">Detalles adicionales</h3>
                <p className="text-[#6e0ad6] leading-relaxed">{ad.details}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && currentMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-50"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {renderMedia(currentMedia, true)}

            {ad.media && ad.media.length > 1 && (
              <>
                <button
                  onClick={handlePrevMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 text-white p-4 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                >
                  <ArrowLeftIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={handleNextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-white p-4 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                >
                  <ArrowLeftIcon className="w-8 h-8 rotate-180" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      {isChatOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
            onClick={() => setIsChatOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl pointer-events-auto transform transition-transform duration-300 translate-x-0">
            <React.Suspense fallback={<div className="p-4">Cargando chat...</div>}>
              <ChatViewWrapper
                ad={ad}
                buyer={currentUser}
                seller={seller}
                onBack={() => setIsChatOpen(false)}
                onClose={() => setIsChatOpen(false)}
              />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-[#b94509] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-6 max-w-md w-full animate-fade-in-up cursor-pointer hover:scale-105 transition-transform duration-300 border border-white/10"
            onClick={() => {
                setIsChatOpen(true);
                setNotification(null);
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                        <ChatIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-lg font-bold text-white leading-tight">Nuevo mensaje de {notification.senderName}</p>
                        <p className="text-white/80 text-sm mt-1 truncate max-w-[200px]">{notification.text}</p>
                    </div>
                </div>
                <button
                    className="text-white/60 hover:text-white transition-colors p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        setNotification(null);
                    }}
                >
                    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

// Wrapper to lazy load ChatView and handle logic
const ChatViewWrapper = React.lazy(() => import('./ChatView').then(module => ({ default: module.default })));

export default AdDetail;
