import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ad, User } from '../types';
import AdCard from './AdCard';
import AdFilters, { FilterValues } from './AdFilters';
import { apiService } from '../services/apiService';

interface HomePageProps {
  currentUser: User | null;
  ads: Ad[];
  users: User[];
  onSelectAd: (adId: number) => void;
  onShowDashboard: () => void;
  onShowLogin: () => void;
  onShowRegister: () => void;
  onLogout: () => void;
  onCreateAd: () => void;
  onAdsUpdate: (ads: Ad[]) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  ads,
  users,
  onSelectAd,
  onShowDashboard,
  onShowLogin,
  onShowRegister,
  onLogout,
  onCreateAd,
  onAdsUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAds, setFilteredAds] = useState<Ad[]>(ads);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    category: 'Todas',
    minPrice: 0,
    maxPrice: 100000,
    location: ''
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAds(ads);
      return;
    }

    setIsSearching(true);
    const searchTimeout = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filtered = ads.filter(ad =>
        ad.title.toLowerCase().includes(query) ||
        ad.description.toLowerCase().includes(query) ||
        ad.details?.toLowerCase().includes(query) ||
        ad.uniqueCode.toLowerCase().includes(query) ||
        users.find(u => u.id === ad.sellerId)?.name.toLowerCase().includes(query)
      );

      setFilteredAds(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, ads, users]);

  const saveSearchToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleFilterChange = async (newFilters: FilterValues) => {
    setFilters(newFilters);
    setIsSearching(true);

    try {
      if (currentUser) {
        const filtered = await apiService.getAdsWithFavorites(currentUser.id, {
          category: newFilters.category !== 'Todas' ? newFilters.category : undefined,
          minPrice: newFilters.minPrice > 0 ? newFilters.minPrice : undefined,
          maxPrice: newFilters.maxPrice < 100000 ? newFilters.maxPrice : undefined,
          location: newFilters.location || undefined,
          search: searchQuery || undefined
        });
        setFilteredAds(filtered);
        onAdsUpdate(filtered);
      } else {
        let filtered = ads;
        if (newFilters.category !== 'Todas') {
          filtered = filtered.filter(ad => ad.category === newFilters.category);
        }
        if (newFilters.minPrice > 0) {
          filtered = filtered.filter(ad => ad.price >= newFilters.minPrice);
        }
        if (newFilters.maxPrice < 100000) {
          filtered = filtered.filter(ad => ad.price <= newFilters.maxPrice);
        }
        if (newFilters.location) {
          filtered = filtered.filter(ad =>
            ad.location?.toLowerCase().includes(newFilters.location.toLowerCase())
          );
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(ad =>
            ad.title.toLowerCase().includes(query) ||
            ad.description.toLowerCase().includes(query)
          );
        }
        setFilteredAds(filtered);
      }
    } catch (error) {
      console.error('Error aplicando filtros:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'Todas',
      minPrice: 0,
      maxPrice: 100000,
      location: ''
    });
    setSearchQuery('');
    setFilteredAds(ads);
  };

  const handleToggleFavorite = async (adId: number) => {
    if (!currentUser) {
      onShowLogin();
      return;
    }

    try {
      const ad = filteredAds.find(a => a.id === adId);
      if (!ad) return;

      if (ad.isFavorite) {
        await apiService.removeFavorite(currentUser.id, adId);
      } else {
        await apiService.addFavorite(currentUser.id, adId);
      }

      const updatedAds = filteredAds.map(a =>
        a.id === adId ? { ...a, isFavorite: !a.isFavorite } : a
      );
      setFilteredAds(updatedAds);
      onAdsUpdate(updatedAds);
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  };

  const getSellerInfo = (sellerId: number) => {
    return users.find(u => u.id === sellerId);
  };

  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false); // Scrolling down
      } else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true); // Scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* LIQUID FUTURISTIC BACKGROUND */}
      {/* LIQUID FUTURISTIC BACKGROUND - OPTIMIZED */}
      <div className="fixed inset-0 z-0 transform-gpu">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-black opacity-80" />

        {/* CSS Animation Blobs - Lighter than Framer Motion for continuous background loops */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/20 rounded-full blur-[80px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] bg-cyan-500/15 rounded-full blur-[80px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] bg-indigo-600/15 rounded-full blur-[80px] mix-blend-screen animate-blob animation-delay-4000" />

        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
          will-change: transform;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* HEADER FLOTANTE */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: isNavVisible ? 0 : -100, opacity: isNavVisible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="sticky top-4 z-50 mx-4 lg:mx-auto max-w-7xl"
      >
        <div className="
          bg-white/90 backdrop-blur-md border border-white/20 
          rounded-2xl shadow-xl shadow-black/5 px-6 py-3
          flex justify-between items-center
        ">
          {/* LOGO JOLUB */}
          <div className="flex items-center cursor-pointer select-none">
            <motion.span
              className="text-4xl font-black text-blue-600 drop-shadow-sm mr-0.5 inline-block origin-bottom-right"
            >
              J
            </motion.span>
            <span className="text-xl font-bold text-gray-800 tracking-widest opacity-80 transition-all duration-300">
              OLU
            </span>
            <motion.span
              className="text-4xl font-black text-blue-600 drop-shadow-sm ml-0.5 inline-block origin-bottom-left"
            >
              B
            </motion.span>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateAd}
                  className="
                    hidden sm:block bg-gray-900 hover:bg-black
                    text-white font-bold py-2 px-6 rounded-full 
                    shadow-lg shadow-gray-900/20 transition-all
                  "
                >
                  + Publicar
                </motion.button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="relative cursor-pointer group" onClick={onShowDashboard}>
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 transition-all group-hover:ring-blue-500"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <button onClick={onShowLogin} className="text-gray-600 hover:text-black font-medium px-4 py-2 transition-colors">Acceder</button>
                <button
                  onClick={onShowRegister}
                  className="bg-gray-900 hover:bg-black text-white font-medium px-5 py-2 rounded-full shadow-lg shadow-gray-900/20 transition-all"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">

        {/* HERO SECTION */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-8 tracking-tighter leading-[1.1]"
          >
            Donde Encuentras y Vendes <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-gradient-x">
              lo que Necesitas
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            El marketplace de nueva generación. Compra, vende e intercambia con una experiencia fluida y segura.
          </motion.p>

          {/* SEARCH BAR GLASSMORPHISM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-3xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <div className="pl-4 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar productos, servicios o códigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveSearchToHistory(searchQuery)}
                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-lg py-3 px-4"
              />
              {isSearching && (
                <div className="pr-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </motion.div>

          {/* SEARCH HISTORY */}
          {!searchQuery && searchHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex flex-wrap justify-center gap-2"
            >
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(term)}
                  className="px-4 py-1.5 bg-surface/50 hover:bg-surface text-gray-400 hover:text-primary text-sm rounded-full border border-white/5 transition-all"
                >
                  {term}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* FILTERS & GRID */}
        <div className="space-y-8">
          <AdFilters onFilterChange={handleFilterChange} onReset={handleResetFilters} />

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredAds.length > 0 ? (
                filteredAds.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    seller={getSellerInfo(ad.sellerId)}
                    onSelect={() => onSelectAd(ad.id)}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-20"
                >
                  <div className="inline-block p-6 rounded-full bg-surface/50 mb-4">
                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-300">No se encontraron resultados</h3>
                  <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda o filtros.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-surface/30 backdrop-blur-lg mt-20 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-700 dark:text-gray-300 mb-4">JOLUB</h2>
          <p className="text-gray-500 text-sm">© 2026 JOLUB Marketplace. Designed with JE UI.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

