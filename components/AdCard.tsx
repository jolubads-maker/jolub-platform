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
    <div
      onClick={onSelect}
      className="
        relative bg-white rounded-3xl overflow-hidden 
        shadow-lg shadow-blue-500/20 
        hover:shadow-2xl hover:shadow-blue-500/30 
        transform hover:-translate-y-1 
        transition-all duration-500 ease-out
        cursor-pointer group 
        border border-gray-100
      "
    >
      {/* Imagen Principal - Protagonista */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        {firstMedia ? (
          firstMedia.type === 'image' ? (
            <img
              src={firstMedia.url}
              alt={ad.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <video
              src={firstMedia.url}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              muted loop autoPlay playsInline
            />
          )
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-sm">No image</span>
          </div>
        )}

        {/* Overlay sutil solo en hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>

        {/* Badges Flotantes Minimalistas */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {ad.category}
          </div>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          {/* Vistas */}
          <div className="bg-black/20 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center">
            <EyeIcon className="w-3 h-3 mr-1" />
            {ad.views.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Contenido Minimalista */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
            {ad.title}
          </h3>
          {currentUser && onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className={`ml-2 p-1.5 rounded-full transition-colors ${ad.isFavorite
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-300 hover:text-red-500 hover:bg-gray-50'
                }`}
            >
              <svg className={`w-5 h-5 ${ad.isFavorite ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-bold text-gray-900">${ad.price.toLocaleString()}</span>
        </div>

        {/* Info Vendedor y Ubicación */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {seller && (
            <div className="flex items-center gap-2">
              <img
                src={seller.avatar}
                alt={seller.name}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
              />
              <span className="text-xs font-medium text-gray-500 truncate max-w-[100px]">{seller.name}</span>
            </div>
          )}

          {ad.location && (
            <span className="text-xs text-gray-400 flex items-center truncate max-w-[120px]">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {ad.location}
            </span>
          )}
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