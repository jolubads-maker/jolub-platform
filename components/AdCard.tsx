import React, { memo } from 'react';
import { motion } from 'framer-motion';
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
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(ad.id);
    }
  };

  return (
    <motion.div
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -10,
        scale: 1.02,
        rotateX: 2,
        rotateY: 2,
        transition: { type: 'spring', stiffness: 300, damping: 15 }
      }}
      className="
        relative group cursor-pointer
        bg-surface/40 backdrop-blur-xl 
        border border-white/10 rounded-3xl overflow-hidden
        shadow-lg shadow-blue-500/5
        hover:shadow-2xl hover:shadow-blue-500/20
        transition-all duration-500
      "
    >
      {/* Imagen Principal - Relación 4:3 con Zoom Suave */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-900/50">
        {firstMedia ? (
          firstMedia.type === 'image' ? (
            <motion.img
              src={firstMedia.url}
              alt={ad.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ) : (
            <motion.video
              src={firstMedia.url}
              className="w-full h-full object-cover"
              muted loop autoPlay playsInline
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <span className="text-gray-600 text-sm">Sin imagen</span>
          </div>
        )}

        {/* Overlay Gradiente Cinemático */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />

        {/* Badges Flotantes (Glassmorphism) */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <div className="
            px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase
            bg-white/10 backdrop-blur-md border border-white/20 text-white
            shadow-lg shadow-black/20
          ">
            {ad.category}
          </div>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <div className="
            flex items-center gap-1 px-2 py-1 rounded-full
            bg-black/30 backdrop-blur-md border border-white/10 text-white/90
          ">
            <EyeIcon className="w-3 h-3" />
            <span className="text-[10px] font-medium">{ad.views.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="
            text-lg font-bold text-white leading-tight line-clamp-1
            group-hover:text-primary transition-colors duration-300
          ">
            {ad.title}
          </h3>

          {currentUser && onToggleFavorite && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleFavoriteClick}
              className={`
                p-2 rounded-full backdrop-blur-sm transition-all duration-300
                ${ad.isFavorite
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-400'}
              `}
            >
              <svg className={`w-5 h-5 ${ad.isFavorite ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </motion.button>
          )}
        </div>

        {/* Precio con Gradiente */}
        <div className="mb-4">
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            ${ad.price.toLocaleString()}
          </span>
        </div>

        {/* Footer: Vendedor y Ubicación */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {seller && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
                />
                {seller.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-surface"></span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-400 truncate max-w-[100px] group-hover:text-gray-300 transition-colors">
                {seller.name}
              </span>
            </div>
          )}

          {ad.location && (
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate max-w-[80px]">{ad.location}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.ad.id === next.ad.id &&
    prev.ad.isFavorite === next.ad.isFavorite &&
    prev.ad.views === next.ad.views &&
    prev.currentUser?.id === next.currentUser?.id &&
    prev.seller?.id === next.seller?.id
  );
});

AdCard.displayName = 'AdCard';

export default AdCard;