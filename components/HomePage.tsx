import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Ad } from '../src/types';
import AdCard from './AdCard';
import AdFilters, { FilterValues } from './AdFilters';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/useAuthStore';
import { useAdStore } from '../store/useAdStore';
import UserStatusBadge from './UserStatusBadge';
import HeroCarousel from './HeroCarousel';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Global State
  const { currentUser, logout } = useAuthStore();
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialize filteredAds with all ads when ads change, BUT only if not searching
  useEffect(() => {
    if (!searchQuery && filters.category === 'Todas' && filters.minPrice === 0 && filters.maxPrice === 100000 && !filters.location) {
      setFilteredAds(ads);
    }
  }, [ads, searchQuery, filters]);

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }

    // Click outside to close search dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // Re-apply filters if search is cleared
      applyFilters(filters, '');
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);
    const searchTimeout = setTimeout(() => {
      applyFilters(filters, searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, ads]);

  const saveSearchToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    setShowSearchDropdown(false);
  };

  const applyFilters = async (currentFilters: FilterValues, query: string) => {
    setIsSearching(true);
    try {
      // Local filtering for immediate feedback (since we have ads in store)
      // Ideally this should be server-side for large datasets, but for now hybrid is fine
      let results = ads;

      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(ad =>
          ad.title.toLowerCase().includes(lowerQuery) ||
          ad.description.toLowerCase().includes(lowerQuery) ||
          ad.category.toLowerCase().includes(lowerQuery)
        );
      }

      if (currentFilters.category !== 'Todas') {
        results = results.filter(ad => ad.category === currentFilters.category);
      }

      if (currentFilters.minPrice > 0) {
        results = results.filter(ad => ad.price >= currentFilters.minPrice);
      }

      if (currentFilters.maxPrice < 100000) {
        results = results.filter(ad => ad.price <= currentFilters.maxPrice);
      }

      if (currentFilters.location) {
        results = results.filter(ad => ad.location.toLowerCase().includes(currentFilters.location.toLowerCase()));
      }

      setFilteredAds(results);
    } catch (error) {
      console.error('Error filtering ads:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = useCallback(async (newFilters: FilterValues) => {
    setFilters(newFilters);
    setIsSearching(true);
    await applyFilters(newFilters, searchQuery);
    setIsSearching(false);
  }, [searchQuery, ads]);

  const handleResetFilters = useCallback(() => {
    const defaultFilters = {
      category: 'Todas',
      minPrice: 0,
      maxPrice: 100000,
      location: ''
    } as FilterValues;
    setFilters(defaultFilters);
    setSearchQuery('');
    setFilteredAds(ads);
  }, [ads]);

  const handleToggleFavorite = useCallback(async (adId: number) => {
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
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  }, [currentUser, filteredAds, navigate]);

  const handleSelectAd = useCallback(async (adId: number) => {
    await incrementViews(adId);
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      navigate(`/anuncio/${ad.uniqueCode}`);
    }
  }, [ads, incrementViews, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-olx-purple/30 relative">

      {/* GLASSMORPHISM HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4 md:gap-8">

          {/* LOGO */}
          <div className="flex-shrink-0 cursor-pointer flex items-center gap-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-olx-orange to-orange-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all">
              <span className="text-white font-black text-2xl">J</span>
            </div>
            <span className="text-gray-800 font-black text-2xl tracking-tight hidden sm:block">OLUB</span>
          </div>

          {/* SMART SEARCH BAR */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <div className="relative flex items-center w-full h-12 bg-gray-100/50 hover:bg-white border border-transparent hover:border-gray-200 rounded-full overflow-hidden transition-all focus-within:ring-2 focus-within:ring-olx-purple/20 focus-within:bg-white focus-within:shadow-lg">
              <div className="pl-4 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                className="w-full h-full px-3 text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveSearchToHistory(searchQuery)}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                  className="pr-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* PREDICTIVE DROPDOWN */}
            <AnimatePresence>
              {showSearchDropdown && (filteredAds.length > 0 || searchHistory.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="p-2">
                    {filteredAds.length > 0 ? (
                      <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Resultados Sugeridos</div>
                        {filteredAds.slice(0, 5).map(ad => (
                          <div
                            key={ad.id}
                            onClick={() => handleSelectAd(ad.id)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                          >
                            <img src={ad.images[0] || 'https://via.placeholder.com/50'} alt={ad.title} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <div className="text-sm font-medium text-gray-800 line-clamp-1">{ad.title}</div>
                              <div className="text-xs text-olx-purple font-bold">${ad.price.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">No se encontraron resultados exactos.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 sm:gap-6">
            {currentUser ? (
              <>
                <button onClick={() => navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`)} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-olx-purple transition-colors font-medium">
                  <span>Mis Anuncios</span>
                </button>

                <UserStatusBadge
                  avatar={currentUser.avatar}
                  name={currentUser.name}
                  isOnline={currentUser.isOnline}
                  showName={false}
                  onClick={() => navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`)}
                  className="cursor-pointer"
                />

                <button
                  onClick={() => navigate('/publicar')}
                  className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  + Vender
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block">
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Vender
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* HERO CAROUSEL */}
        <HeroCarousel />

        {/* FILTERS */}
        <div className="mb-8 sticky top-24 z-30">
          <AdFilters onFilterChange={handleFilterChange} onReset={handleResetFilters} />
        </div>

        {/* MASONRY GRID */}
        <div className="min-h-[400px]">
          <AnimatePresence mode='popLayout'>
            {filteredAds.length > 0 ? (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {filteredAds.map((ad) => (
                  <div key={ad.id} className="break-inside-avoid mb-4">
                    <AdCard
                      ad={ad}
                      seller={ad.seller}
                      onSelect={() => handleSelectAd(ad.id)}
                      currentUser={currentUser}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="p-6 rounded-full bg-gray-50 mb-4">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">No encontramos lo que buscas</h3>
                <p className="text-gray-500 mt-2">Intenta con otros términos o elimina los filtros.</p>
                <button onClick={handleResetFilters} className="mt-6 text-olx-purple font-semibold hover:underline">
                  Ver todos los anuncios
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 mt-20 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-black text-lg">J</span>
            </div>
            <span className="text-gray-400 font-black text-xl tracking-tight">OLUB</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 JOLUB Marketplace. Designed for the Future.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;



