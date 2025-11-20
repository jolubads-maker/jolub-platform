import React, { useState, useEffect } from 'react';
import { Ad, User, Media } from '../types';
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

  useEffect(() => {
    if (ad.media && ad.media.length > 0) {
      setActiveMedia(ad.media[0]);
    }
  }, [ad]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const renderMedia = (media: Media) => {
    if (!media) return null;
    if (media.type === 'image') {
      return (
        <img
          src={media.url}
          alt={ad.title}
          className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
        />
      );
    } else {
      return (
        <video
          src={media.url}
          controls
          className="w-full h-full object-contain"
        />
      );
    }
  };

  const showChatButton = currentUser && currentUser.id !== seller.id;

  return (
    <div className={`min-h-screen bg-gray-50 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background Elements for "Dynamic" feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 py-8">
        {/* Header Navigation */}
        <button
          onClick={onBack}
          className="group flex items-center text-gray-600 hover:text-jolub-blue mb-8 transition-all duration-300 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm hover:shadow-md"
        >
          <div className="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-full mr-3 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="font-medium">Volver a resultados</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden aspect-[4/3] group">
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                {activeMedia ? renderMedia(activeMedia) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <span className="text-6xl mb-2">📷</span>
                    <p>Sin imagen</p>
                  </div>
                )}
              </div>

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                  {ad.category || 'General'}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {ad.media && ad.media.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {ad.media.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveMedia(media)}
                    className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all duration-300 ${activeMedia?.url === media.url
                      ? 'ring-4 ring-jolub-blue ring-offset-2 scale-105'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white text-2xl">▶</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Description Section (Desktop) */}
            <div className="hidden lg:block bg-white rounded-3xl shadow-lg p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                {ad.description}
              </p>

              {ad.details && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Detalles adicionales</h3>
                  <p className="text-gray-600 leading-relaxed">{ad.details}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 p-8 sticky top-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-2">
                    {ad.title}
                  </h1>
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3">#{ad.uniqueCode}</span>
                    <span className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-1" /> {ad.views} vistas
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  ${ad.price.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xl ml-2 font-medium">USD</span>
              </div>

              {/* Seller Card */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 mb-8 border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={seller.avatar}
                      alt={seller.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Vendedor</p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{seller.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-red-500'}`} title={seller.isOnline ? 'Online' : 'Offline'}></div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {seller.points} pts
                      </span>
                      {seller.phoneVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {showChatButton ? (
                  <button
                    onClick={() => onStartChat(seller.id)}
                    disabled={!seller.isOnline}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transform transition-all duration-200 hover:-translate-y-1 flex items-center justify-center ${seller.isOnline
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30'
                      : 'bg-gray-100 text-red-500 border-2 border-red-100 cursor-not-allowed'
                      }`}
                  >
                    <ChatIcon className="w-6 h-6 mr-2" />
                    Chat
                  </button>
                ) : !currentUser ? (
                  <button
                    onClick={() => onStartChat(seller.id)}
                    className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gray-900 text-white shadow-lg hover:bg-gray-800 transform transition-all duration-200 hover:-translate-y-1"
                  >
                    Iniciar Sesión para Contactar
                  </button>
                ) : (
                  <div className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gray-100 text-gray-400 text-center border-2 border-dashed border-gray-200">
                    Este es tu anuncio
                  </div>
                )}

                <button className="w-full py-3 px-6 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                  Guardar en Favoritos
                </button>
              </div>
            </div>

            {/* Description Section (Mobile) */}
            <div className="block lg:hidden bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {ad.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetail;
