import React, { useState } from 'react';
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
  const [activeMedia, setActiveMedia] = useState<Media>(ad.media[0]);

  const renderMedia = (media: Media) => {
    if (media.type === 'image') {
      return <img src={media.url} alt={ad.title} className="w-full h-full object-contain rounded-2xl" />;
    } else {
      return <video src={media.url} controls className="w-full h-full object-contain rounded-2xl" />;
    }
  };

  const showChatButton = currentUser && currentUser.id !== seller.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Botón Volver */}
        <button 
          onClick={onBack} 
          className="flex items-center text-jolub-blue hover:text-jolub-dark mb-6 transition duration-300 font-semibold group"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
          Volver a la lista
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna de Imágenes/Videos */}
          <div className="lg:col-span-2">
            {/* Imagen/Video Principal */}
            <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-6 mb-6">
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
                {activeMedia ? renderMedia(activeMedia) : (
                  <div className="text-gray-400 text-center">
                    <span className="text-6xl">📦</span>
                    <p className="mt-2">Sin imagen disponible</p>
                  </div>
                )}
              </div>

              {/* Badges sobre la imagen */}
              <div className="absolute top-8 left-8 flex space-x-2">
                <div className="bg-jolub-blue text-white px-4 py-2 rounded-full shadow-lg font-mono font-bold">
                  {ad.uniqueCode}
                </div>
                <div className="bg-white/95 text-jolub-blue px-4 py-2 rounded-full shadow-lg flex items-center">
                  <EyeIcon className="w-5 h-5 mr-2" />
                  <span className="font-bold">{ad.views} vistas</span>
                </div>
              </div>
            </div>

            {/* Miniaturas */}
            {ad.media.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {ad.media.map((media, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 w-24 h-24 cursor-pointer transition-all duration-300 hover:scale-105" 
                    onClick={() => setActiveMedia(media)}
                  >
                    <div className={`w-full h-full rounded-xl overflow-hidden border-4 transition-all ${
                      activeMedia.url === media.url 
                        ? 'border-jolub-blue shadow-lg' 
                        : 'border-gray-200 hover:border-jolub-blue/50'
                    }`}>
                      {media.type === 'image' ? (
                        <img src={media.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="relative w-full h-full">
                          <video src={media.url} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna de Información */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información del Producto */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-6">
              <h1 className="text-3xl font-black text-gray-800 mb-3 leading-tight">{ad.title}</h1>
              <div className="flex items-baseline mb-6">
                <p className="text-5xl font-black text-jolub-blue">${ad.price.toLocaleString()}</p>
                <span className="ml-2 text-gray-500">USD</span>
              </div>
              
              <div className="border-t-2 border-gray-200 pt-4 mb-4">
                <h3 className="text-lg font-bold text-gray-700 mb-2">📝 Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{ad.description}</p>
              </div>

              {ad.details && (
                <div className="border-t-2 border-gray-200 pt-4">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">ℹ️ Detalles Adicionales</h3>
                  <p className="text-gray-600 leading-relaxed">{ad.details}</p>
                </div>
              )}
            </div>

            {/* Información del Vendedor */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">👤 Vendedor</h3>
              <div className="flex items-center mb-4">
                <div className="relative">
                  <img 
                    src={seller.avatar} 
                    alt={seller.name} 
                    className="w-20 h-20 rounded-full border-4 border-jolub-blue shadow-lg"
                  />
                  <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white ${
                    seller.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="ml-4">
                  <p className="font-bold text-gray-800 text-xl">{seller.name}</p>
                  <p className={`text-sm font-medium ${seller.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {seller.isOnline ? '🟢 En línea ahora' : `⚫ Última vez: ${seller.lastSeen ? new Date(seller.lastSeen).toLocaleString() : 'Desconocido'}`}
                  </p>
                  {seller.email && (
                    <p className="text-xs text-gray-500 mt-1">{seller.email}</p>
                  )}
                </div>
              </div>

              {/* Estadísticas del Vendedor */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-jolub-blue">{seller.points}</p>
                  <p className="text-xs text-gray-600 font-medium">Puntos</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-jolub-blue">
                    {seller.phoneVerified ? '✓' : '✗'}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">Verificado</p>
                </div>
              </div>

              {/* Botón de Chat */}
              {showChatButton && (
                <button
                  onClick={() => onStartChat(seller.id)}
                  disabled={!seller.isOnline}
                  className={`w-full font-bold py-4 px-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    seller.isOnline 
                      ? 'bg-gradient-to-r from-jolub-blue to-blue-600 hover:from-jolub-dark hover:to-blue-700 text-white cursor-pointer transform hover:scale-105 hover:shadow-xl' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ChatIcon className="w-6 h-6 mr-2" />
                  {seller.isOnline ? '💬 Chatear con el vendedor' : '⚫ Vendedor no disponible'}
                </button>
              )}
              
              {!currentUser && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-sm text-gray-600">
                    <button 
                      onClick={(e) => { e.preventDefault(); onStartChat(seller.id); }} 
                      className="text-jolub-blue hover:text-jolub-dark font-bold underline"
                    >
                      Inicia sesión
                    </button> para chatear con el vendedor
                  </p>
                </div>
              )}
            </div>

            {/* Información Adicional */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl shadow-lg p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Información del Anuncio</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Código único:</span>
                  <span className="font-mono font-bold text-jolub-blue">{ad.uniqueCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vistas totales:</span>
                  <span className="font-bold text-gray-800">{ad.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID del anuncio:</span>
                  <span className="font-bold text-gray-800">#{ad.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendedor ID:</span>
                  <span className="font-bold text-gray-800">#{seller.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetail;
