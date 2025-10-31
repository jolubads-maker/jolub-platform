import React, { memo } from 'react';
import { Ad, User } from '../types';
import EyeIcon from './icons/EyeIcon';

interface AdCardProps {
  ad: Ad;
  seller?: User;
  onSelect: () => void;
  currentUser?: User | null;
  onToggleFavorite?: (adId: number) => void;
}

const AdCard: React.FC<AdCardProps> = memo(({ ad, seller, onSelect, currentUser, onToggleFavorite }) => {
  const firstMedia = ad.media[0];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el onSelect
    if (onToggleFavorite) {
      onToggleFavorite(ad.id);
    }
  };

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

        {/* Botón de Favorito */}
        {currentUser && onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-16 right-4 p-2.5 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 transform hover:scale-110 ${
              ad.isFavorite 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/70 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
            title={ad.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {ad.isFavorite ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}

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
        {/* Categoría y Ubicación */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {ad.category}
          </span>
          {ad.location && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {ad.location}
            </span>
          )}
        </div>
        
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
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.ad.id === nextProps.ad.id &&
    prevProps.ad.isFavorite === nextProps.ad.isFavorite &&
    prevProps.ad.views === nextProps.ad.views &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.seller?.id === nextProps.seller?.id
  );
});

AdCard.displayName = 'AdCard';

export default AdCard;