import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Ad } from '../types';
import AdCard from './AdCard';
import AdFilters, { FilterValues } from './AdFilters';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/useAuthStore';
import { useAdStore } from '../store/useAdStore';
import UserStatusBadge from './UserStatusBadge';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Global State
  const { currentUser, logout, users } = useAuthStore();
  const { ads, incrementViews } = useAdStore();

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    category: 'Todas',
    minPrice: 0,
    maxPrice: 100000,
    location: ''
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Initialize filteredAds with all ads when ads change
  useEffect(() => {
    setFilteredAds(ads);
  }, [ads]);

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // Re-apply filters if search is cleared
      applyFilters(filters, '');
      return;
    }

    setIsSearching(true);
    const searchTimeout = setTimeout(() => {
      applyFilters(filters, searchQuery);
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

  const applyFilters = async (currentFilters: FilterValues, query: string) => {
    // We can filter locally since we have all ads in store
    // Or we can use the API if we want server-side filtering (better for large datasets)
    // For now, let's stick to the existing logic which seemed to mix both?
    // The original code called apiService.getAdsWithFavorites if currentUser existed, 
    // or filtered locally if not.
    // To keep it simple and consistent with the store, let's filter locally for now, 
    // unless we want to implement server-side filtering in the store.
    // Given the "Refactoring" goal, let's try to use the store data.

    let result = ads;

    // 1. Category
    if (currentFilters.category !== 'Todas') {
      result = result.filter(ad => ad.category === currentFilters.category);
    }

    // 2. Price
    if (currentFilters.minPrice > 0) {
      result = result.filter(ad => ad.price >= currentFilters.minPrice);
    }
    if (currentFilters.maxPrice < 100000) {
      result = result.filter(ad => ad.price <= currentFilters.maxPrice);
    }

    // 3. Location
    if (currentFilters.location) {
      result = result.filter(ad =>
        ad.location?.toLowerCase().includes(currentFilters.location.toLowerCase())
      );
    }

    // 4. Search Query
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(ad =>
        ad.title.toLowerCase().includes(lowerQuery) ||
        ad.description.toLowerCase().includes(lowerQuery) ||
        ad.details?.toLowerCase().includes(lowerQuery) ||
        ad.uniqueCode.toLowerCase().includes(lowerQuery) ||
        users.find(u => u.id === ad.sellerId)?.name.toLowerCase().includes(lowerQuery)
      );
    }

    // 5. Favorites (if logged in, we might want to fetch this status? 
    // The store ads might not have 'isFavorite' property set for the current user 
    // unless we fetched it specifically for them.
    // The original code used apiService.getAdsWithFavorites.
    // We should probably update the store to handle favorites or fetch them separately.
    // For now, let's assume the store ads are "raw" and we might miss the favorite status 
    // unless we merge it.
    // Let's check if we can fetch favorites and merge.
    if (currentUser) {
      try {
        const favorites = await apiService.getUserFavorites(currentUser.id);
        const favoriteIds = new Set(favorites.map(f => f.id));
        result = result.map(ad => ({
          ...ad,
          isFavorite: favoriteIds.has(ad.id)
        }));
      } catch (e) {
        console.error('Error fetching favorites', e);
      }
    }

    setFilteredAds(result);
  };

  const handleFilterChange = async (newFilters: FilterValues) => {
    setFilters(newFilters);
    setIsSearching(true);
    await applyFilters(newFilters, searchQuery);
    setIsSearching(false);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      category: 'Todas',
      minPrice: 0,
      maxPrice: 100000,
      location: ''
    } as FilterValues;
    setFilters(defaultFilters);
    setSearchQuery('');
    setFilteredAds(ads);
  };

  const handleToggleFavorite = async (adId: number) => {
    if (!currentUser) {
      navigate('/login');
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

      // Update local state
      const updatedAds = filteredAds.map(a =>
        a.id === adId ? { ...a, isFavorite: !a.isFavorite } : a
      );
      setFilteredAds(updatedAds);

      // We should also update the store if possible, but store ads don't strictly track favorites per user globally
      // So local update is fine for now.
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  };

  const getSellerInfo = (sellerId: number) => {
    return users.find(u => u.id === sellerId);
  };

  const handleSelectAd = async (adId: number) => {
    await incrementViews(adId);
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      navigate(`/anuncio/${ad.uniqueCode}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
    <div className="min-h-screen bg-background text-olx-dark font-sans selection:bg-olx-purple/30 relative overflow-hidden">

      {/* HEADER OLX STYLE */}
      <header className="sticky top-0 z-50 w-full bg-olx-purple shadow-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">

          {/* LOGO */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <h1 className="text-4xl font-black text-white tracking-tighter">JOLUB</h1>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-3xl hidden md:block">
            <div className="relative flex items-center w-full h-12 bg-white rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-olx-orange transition-all">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full h-full px-4 text-gray-700 placeholder-gray-400 border-none outline-none text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveSearchToHistory(searchQuery)}
              />
              <button
                className="h-full px-6 bg-white hover:bg-gray-50 text-olx-purple transition-colors"
                onClick={() => saveSearchToHistory(searchQuery)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-6 text-white font-semibold">
            {currentUser ? (
              <>
                <button onClick={() => navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`)} className="hover:text-gray-200 transition-colors hidden sm:block">
                  Mis Anuncios
                </button>

                <UserStatusBadge
                  avatar={currentUser.avatar}
                  name={currentUser.name}
                  isOnline={currentUser.isOnline}
                  showName
                  onClick={() => navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`)}
                  className="text-white"
                />

                <button
                  onClick={() => navigate('/publicar')}
                  className="bg-olx-orange hover:bg-orange-600 text-white px-8 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Vender
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hover:text-gray-200 transition-colors">
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-olx-orange hover:bg-orange-600 text-white px-8 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Vender
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">

        {/* HERO SECTION */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-gray-800 mb-6 tracking-tighter leading-[1.1]"
          >
            Donde Encuentras y Vendes <br className="hidden md:block" />
            <span className="text-olx-purple">
              lo que Necesitas
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8"
          >
            El marketplace de nueva generación. Compra, vende e intercambia con una experiencia fluida y segura.
          </motion.p>

          {/* PROMO BANNER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-5xl mx-auto h-48 md:h-64 bg-gradient-to-r from-olx-purple to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center relative overflow-hidden mt-8"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="text-center text-white z-10 px-4">
              <h3 className="text-3xl md:text-4xl font-bold mb-2">¡Vende lo que ya no usas!</h3>
              <p className="text-lg opacity-90">Es fácil, rápido y seguro.</p>
              <button onClick={() => currentUser ? navigate('/publicar') : navigate('/login')} className="mt-6 bg-olx-orange hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-transform transform hover:scale-105">
                Publicar Anuncio Gratis
              </button>
            </div>
          </motion.div>
        </div>   {/* SEARCH HISTORY */}
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


        {/* FILTERS & GRID */}
        <div className="space-y-8">
          <AdFilters onFilterChange={handleFilterChange} onReset={handleResetFilters} />

          {/* Grid Container with Background */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5"
            >
              <AnimatePresence>
                {filteredAds.length > 0 ? (
                  filteredAds.map((ad) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      seller={getSellerInfo(ad.sellerId)}
                      onSelect={() => handleSelectAd(ad.id)}
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
                    <div className="inline-block p-6 rounded-full bg-white mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-600">No se encontraron resultados</h3>
                    <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda o filtros.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main >

      {/* FOOTER */}
      < footer className="relative z-10 border-t border-white/5 bg-surface/30 backdrop-blur-lg mt-20 py-12" >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-700 dark:text-gray-300 mb-4">JOLUB</h2>
          <p className="text-gray-500 text-sm">© 2026 JOLUB Marketplace. Designed with JE UI.</p>
        </div>
      </footer >
    </div >
  );
};

export default HomePage;


