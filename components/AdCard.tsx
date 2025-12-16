import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Ad, User } from '../src/types';
import { optimizeCloudinaryUrl } from '../src/utils/images';
import UserStatusBadge from './UserStatusBadge';
import { getTimeRemaining, formatTimeRemaining, getUrgencyColor } from '../src/utils/time';

interface AdCardProps {
  ad: Ad;
  seller?: User;
  onSelect: () => void;
  currentUser?: User | null;
  onToggleFavorite?: (adId: string | number) => void;
  variant?: 'default' | 'dashboard';
  onHighlight?: (ad: Ad) => void;
}

const AdCard: React.FC<AdCardProps> = memo(({ ad, seller, onSelect, currentUser, onToggleFavorite, variant = 'default', onHighlight }) => {
  const navigate = useNavigate();
  const firstMedia = ad.media?.[0];

  // Calcular tiempo restante para usuarios Free
  const sellerPlan = (seller as any)?.subscriptionPlan || 'free';
  const timeRemaining = useMemo(() => {
    if (!ad.createdAt) return null;
    return getTimeRemaining(ad.createdAt, sellerPlan);
  }, [ad.createdAt, sellerPlan]);

  const urgencyColors = timeRemaining ? getUrgencyColor(timeRemaining) : null;
  const showUrgencyIndicator = timeRemaining && (timeRemaining.isUrgent || timeRemaining.isExpired) && sellerPlan === 'free';
  const isOwner = currentUser && seller && (currentUser.id === seller.id || currentUser.uid === seller.id || currentUser.providerId === seller.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(ad.id);
    }
  };

  const handleHighlightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHighlight) {
      onHighlight(ad);
    }
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/pricing');
  };

  return (
    <motion.div
      onClick={onSelect}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        group cursor-pointer
        bg-white
        ${variant === 'dashboard' ? 'border-2 border-black' : 'border border-gray-100'} 
        ${showUrgencyIndicator && urgencyColors ? urgencyColors.border + ' border-2' : ''}
        rounded-xl overflow-hidden
        shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        transition-all duration-300 ease-out
      `}
    >
      {/* Imagen Principal - Relación 4:3 */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        {firstMedia ? (
          firstMedia.type === 'image' ? (
            <img
              src={optimizeCloudinaryUrl(firstMedia.url)}
              alt={ad.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <video
              src={firstMedia.url}
              className="w-full h-full object-cover"
              muted loop autoPlay playsInline
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">Sin imagen</span>
          </div>
        )}

        {/* Featured Star Icon */}
        {ad.isFeatured && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-[#ea580c] text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Botón de Favorito - Esquina superior derecha (Ocultar en Dashboard) */}
        {currentUser && onToggleFavorite && variant !== 'dashboard' && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200 z-10 group/btn"
          >
            <svg
              className={`w-5 h-5 transition-colors duration-200 ${ad.isFavorite ? 'fill-red-500 text-red-500' : 'fill-transparent text-slate-400 group-hover/btn:text-red-500'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Badge de Expiración - Solo para plan Free con menos de 48h */}
        {showUrgencyIndicator && timeRemaining && urgencyColors && (
          <div className={`absolute top-2 ${ad.isFeatured ? 'left-12' : 'left-2'} z-10`}>
            <div className={`${urgencyColors.bg} text-white px-2 py-1 rounded-lg shadow-lg text-xs font-bold flex items-center gap-1 ${timeRemaining.isCritical ? 'animate-pulse' : ''}`}>
              <span>⚠️</span>
              <span>Expira en {formatTimeRemaining(timeRemaining)}</span>
            </div>
          </div>
        )}

        {/* Barra de Progreso de Expiración - Solo para plan Free con menos de 48h */}
        {showUrgencyIndicator && timeRemaining && urgencyColors && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${timeRemaining.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${urgencyColors.bg}`}
            />
          </div>
        )}
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-4 flex flex-col gap-1">
        {/* Precio */}
        <div className="mb-0.5">
          <span className="text-xl font-black text-purple-700 tracking-tight">
            ${ad.price.toLocaleString()}
          </span>
        </div>

        {/* Título del producto */}
        <h3 className="text-gray-900 text-sm font-bold leading-snug line-clamp-2 min-h-[2.5em]">
          {ad.title}
        </h3>

        {/* VARIANT: DASHBOARD */}
        {variant === 'dashboard' ? (
          <div className="flex flex-col gap-2 mt-1">
            {/* Expiration Logic */}
            {(() => {
              const expirationDate = ad.expiresAt
                ? new Date(ad.expiresAt)
                : new Date(new Date(ad.createdAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000);

              const now = new Date();
              const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div className="text-sm font-bold">
                  {daysRemaining > 0 ? (
                    <span className="text-orange-600">Caduca en {daysRemaining} días</span>
                  ) : (
                    <span className="text-red-600 font-bold">Caducado</span>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between border-t border-gray-50 pt-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-6 h-6 text-[#6e0ad6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-black text-lg font-bold">{ad.views}</span>
              </div>
              {!ad.isFeatured && (
                <button
                  onClick={handleHighlightClick}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  Destacar
                </button>
              )}
            </div>
          </div>
        ) : (
          /* VARIANT: DEFAULT */
          <>
            {/* Ubicación y fecha */}
            <div className="mt-2 flex justify-between items-end border-t border-gray-50 pt-2">
              <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wide truncate max-w-[70%]">
                {ad.location || 'Ubicación no disponible'}
              </span>
            </div>

            {/* Información del Vendedor */}
            {seller && (
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-100">
                <UserStatusBadge
                  avatar={seller.avatar}
                  name={seller.name}
                  isOnline={seller.isOnline}
                  size="sm"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 leading-none mb-1">
                    {seller.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-purple-600">
                      {seller.points} Puntos
                    </span>
                    {seller.points > 5 && (
                      <span className="flex items-center gap-0.5 text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100 font-medium">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Confiable
                      </span>
                    )}
                    {seller.points < 1 && (
                      <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-100 font-medium">
                        Nuevo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.ad.id === next.ad.id &&
    prev.ad.isFavorite === next.ad.isFavorite &&
    prev.ad.views === next.ad.views &&
    prev.currentUser?.id === next.currentUser?.id &&
    prev.seller?.id === next.seller?.id &&
    prev.seller?.isOnline === next.seller?.isOnline &&
    prev.seller?.points === next.seller?.points &&
    prev.variant === next.variant
  );
});

AdCard.displayName = 'AdCard';

export default AdCard;
