import React from 'react';
import { Ad, User } from '../types';
import EyeIcon from './icons/EyeIcon';

interface AdCardProps {
  ad: Ad;
  seller?: User;
  onSelect: () => void;
  currentUser?: User | null;
}

const AdCard: React.FC<AdCardProps> = ({ ad, seller, onSelect, currentUser }) => {
  const firstMedia = ad.media[0];

  return (
    // 🌟 Estilo de la Tarjeta: Sombra suave y bordes grandes
    <div
      onClick={onSelect}
      className="
        bg-white rounded-3xl overflow-hidden 
        shadow-xl shadow-gray-200/70 
        hover:shadow-2xl hover:shadow-blue-200/50 
        transform hover:-translate-y-1 
        transition-all duration-300 
        cursor-pointer group 
        border border-gray-100/70
      "
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        {firstMedia ? (
          firstMedia.type === 'image' ? (
            <img src={firstMedia.url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <video src={firstMedia.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" muted loop autoPlay playsInline />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <span className="text-blue-400 text-sm font-medium">📦 No media available</span>
          </div>
        )}
        
        {/* Degradado para mejorar la legibilidad del texto superior/inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>

        {/* --- Elementos de Información Flotante (Glassmorphism sutil) --- */}

        {/* Vistas */}
        <div className="absolute top-4 right-4 bg-white/70 text-blue-600 text-xs px-3 py-1.5 rounded-full flex items-center backdrop-blur-sm shadow-md border border-white/80">
          <EyeIcon className="w-4 h-4 mr-1"/>
          <span className="font-semibold">{ad.views.toLocaleString()}</span>
        </div>

        {/* Código único del anuncio (Más sutil) */}
        <div className="absolute top-4 left-4 bg-blue-600/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md">
          <span className="font-mono font-semibold">{ad.uniqueCode.slice(0, 8)}</span>
        </div>

        {/* --- Contenido Principal Inferior --- */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-extrabold truncate group-hover:text-blue-300 transition-colors drop-shadow-lg leading-tight">
            {ad.title}
          </h3>
          <p className="text-2xl font-black text-white mt-1 drop-shadow-md">
            ${ad.price.toLocaleString()}
          </p>
          
          {/* Información del Vendedor */}
          {seller && (
            <div className="flex items-center mt-3 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit border border-white/30 transition duration-300 hover:bg-white/20">
              <img 
                src={seller.avatar} 
                alt={seller.name}
                className="w-6 h-6 rounded-full mr-2 object-cover border-2 border-white/50"
              />
              <span className="text-sm font-medium text-gray-100">{seller.name}</span>
              {seller.isOnline && (
                <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse" title="En línea"></div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Información adicional en la parte inferior (Espacio blanco) */}
      <div className="p-4 bg-white">
        <p className="text-gray-500 text-sm line-clamp-2 leading-snug mb-2">{ad.description}</p>
        <div className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors flex items-center mt-1">
          Ver más detalles
          <svg className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AdCard;