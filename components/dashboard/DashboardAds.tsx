import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Ad, User } from '../../src/types';
import AdCard from '../AdCard';
import EyeIcon from '../icons/EyeIcon';

interface DashboardAdsProps {
    userAds: Ad[];
    currentUser: User;
    onSelectAd: (ad: Ad) => void;
    onHighlightAd: (ad: Ad) => void;
    onVerifyEmail: () => void;
}

const DashboardAds: React.FC<DashboardAdsProps> = ({
    userAds,
    currentUser,
    onSelectAd,
    onHighlightAd,
    onVerifyEmail
}) => {
    const navigate = useNavigate();
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const cardWidth = 240;
            const gap = 24;
            const scrollAmount = (cardWidth + gap) * 4;
            const newScrollLeft = direction === 'left'
                ? carouselRef.current.scrollLeft - scrollAmount
                : carouselRef.current.scrollLeft + scrollAmount;

            carouselRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="col-span-1 md:col-span-4 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[450px] relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                    <span className="w-3 h-8 bg-[#6e0ad6] rounded-full shadow-[0_0_15px_rgba(110,10,214,0.5)]" />
                    Mis Publicaciones
                </h3>
                {currentUser.emailVerified && userAds.length > 0 && (
                    <button
                        onClick={() => navigate('/publicar')}
                        className="bg-[#ea580c] hover:bg-[#d9520b] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-md flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Crear Anuncio
                    </button>
                )}
            </div>

            <div className="relative flex-1 group/carousel">
                {/* Left Arrow */}
                {userAds.length > 4 && (
                    <button
                        onClick={() => scrollCarousel('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-[#6e0ad6] text-white p-3 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-[#5b08b0]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                )}

                {/* Carousel Container */}
                <div
                    ref={carouselRef}
                    className={`flex gap-6 overflow-x-auto pb-8 pt-2 px-2 scroll-smooth snap-x snap-mandatory hide-scrollbar h-full items-center ${userAds.length <= 4 ? 'justify-center' : ''}`}
                >
                    {userAds.length > 0 ? (
                        userAds.map(ad => (
                            <div key={ad.id} className="min-w-[240px] max-w-[240px] snap-center">
                                <AdCard
                                    ad={ad}
                                    seller={currentUser}
                                    onSelect={() => onSelectAd(ad)}
                                    currentUser={currentUser}
                                    onToggleFavorite={() => { }}
                                    variant="dashboard"
                                    onHighlight={onHighlightAd}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 opacity-80 min-h-[300px]">
                            {!currentUser.emailVerified ? (
                                <motion.div
                                    onClick={onVerifyEmail}
                                    className="w-full cursor-pointer flex flex-col items-center gap-4 group py-10"
                                >
                                    <div className="transition-transform duration-300 group-hover:scale-110">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#6e0ad6]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xl font-bold text-black block mb-1">Verifica tu email</span>
                                        <span className="text-sm text-black font-medium">Confirma tu correo para publicar anuncios</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 group">
                                    <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                                        <EyeIcon className="w-16 h-16 text-[#ea580c]" />
                                    </div>
                                    <p className="font-bold text-lg text-black">No tienes anuncios activos</p>
                                    <button onClick={() => navigate('/publicar')} className="mt-4 text-[#6e0ad6] font-bold hover:underline">
                                        Crear uno ahora
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Arrow */}
                {userAds.length > 4 && (
                    <button
                        onClick={() => scrollCarousel('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-[#6e0ad6] text-white p-3 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-[#5b08b0]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardAds;
