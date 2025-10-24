import React, { useState, useEffect } from 'react';
import { Ad, User } from '../types';
import AdCard from './AdCard'; // Asumo que también modernizarás AdCard
import UserCircleIcon from './icons/UserCircleIcon';

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
}

// 🎨 Definición de color para el ejemplo (Asegúrate de tenerlos en tu configuración de Tailwind)
// const JOLUB_BLUE = 'custom-blue-500'; // usa un color vibrante para JOLUB_BLUE
// const JOLUB_DARK = 'custom-blue-700';

const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  ads,
  users,
  onSelectAd,
  onShowDashboard,
  onShowLogin,
  onShowRegister,
  onLogout,
  onCreateAd
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAds, setFilteredAds] = useState<Ad[]>(ads);
  const [isSearching, setIsSearching] = useState(false);

  // Filtrar anuncios basado en la búsqueda (Lógica inalterada)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAds(ads);
      return;
    }

    setIsSearching(true);
    
    // Simular análisis de base de datos con delay
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

  const getSellerInfo = (sellerId: number) => {
    return users.find(u => u.id === sellerId);
  };

  return (
    // 💡 Fondo principal: blanco con un toque de textura y mínimo degradado
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      
      {/* 🌟 Header: Modernizado con Glassmorphism (Efecto de desenfoque) */}
      <header 
        className="
          sticky top-0 z-50 
          bg-white/90 backdrop-blur-md 
          shadow-lg shadow-blue-500/5 
          border-b border-blue-100/50
        "
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              {/* Logo con fuente más audaz y moderna */}
              <h1 className="text-4xl font-extrabold text-blue-600 tracking-tighter">
                JOLUB
              </h1>
              <p className="text-xs text-gray-500 mt-1 italic">
                Donde encuentras y vendes lo que necesitas
              </p>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              {currentUser ? (
                <>
                  {/* Botón crear anuncio: Más elegante */}
                  <button
                    onClick={onCreateAd}
                    className="
                      bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                      py-2 px-4 sm:px-6 rounded-xl 
                      shadow-md shadow-blue-500/30 
                      transition duration-300 hidden sm:block 
                      hover:shadow-lg hover:shadow-blue-500/50 
                      transform hover:-translate-y-0.5
                    "
                  >
                    Publicar Anuncio
                  </button>
                  
                  {/* Información del usuario: Más compacta y con sombra */}
                  <div className="flex items-center space-x-2 bg-white rounded-full p-1.5 shadow-lg border border-gray-100">
                    <div className="relative">
                      {/* Avatar */}
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      />
                      {/* Indicador de estado en línea con diseño más sutil */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                        currentUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    {/* Botones de acción del usuario: Íconos más minimalistas y sutiles */}
                    <button
                      onClick={onShowDashboard}
                      className="p-1.5 rounded-full hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600 hidden sm:block"
                      title="Dashboard"
                    >
                      <UserCircleIcon className="w-6 h-6" />
                    </button>
                    
                    <button
                      onClick={onLogout}
                      className="p-1.5 rounded-full hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600"
                      title="Cerrar sesión"
                    >
                      {/* Ícono de logout */}
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={onShowLogin}
                    className="text-blue-600 hover:text-blue-700 font-semibold py-2 px-4 sm:px-6 rounded-full transition duration-300"
                  >
                    Acceder
                  </button>
                  <button
                    onClick={onShowRegister}
                    className="
                      bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                      py-2 px-4 sm:px-6 rounded-full 
                      shadow-md shadow-blue-500/30 
                      transition duration-300 transform hover:scale-105
                    "
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- */}

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-10">
        
        {/* Sección de búsqueda: Más prominente y centrada */}
        <div className="mb-14">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">
              Encuentra tu próxima gran oportunidad 🔎
            </h2>
            <p className="text-gray-500 text-center mb-8 text-lg">
              Explora miles de productos y servicios cerca de ti.
            </p>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por título, código único, vendedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full px-6 py-4 pl-14 
                  bg-white border border-gray-200 rounded-2xl 
                  text-gray-800 placeholder-gray-400 
                  focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500
                  shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-all duration-300
                "
              />
              
              {/* Ícono de búsqueda/Spinner */}
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
            
            {searchQuery && (
              <div className="mt-4 text-sm text-blue-600 text-center font-medium">
                {isSearching ? (
                  '⏳ Buscando anuncios...'
                ) : (
                  `🎉 ${filteredAds.length} resultado${filteredAds.length !== 1 ? 's' : ''} encontrado${filteredAds.length !== 1 ? 's' : ''}!`
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* --- */}

        {/* Botón crear anuncio para móvil */}
        {currentUser && (
          <div className="mb-8 sm:hidden">
            <button
              onClick={onCreateAd}
              className="
                w-full bg-blue-600 hover:bg-blue-700 text-white font-bold 
                py-3 px-4 rounded-xl shadow-lg shadow-blue-500/40 
                transition duration-300 transform hover:scale-[1.01]
              "
            >
              ➕ Publicar Anuncio
            </button>
          </div>
        )}

        {/* Lista de anuncios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAds.length > 0 ? (
            filteredAds.map((ad) => {
              const seller = getSellerInfo(ad.sellerId);
              return (
                // ❗ Asumo que el componente AdCard.tsx también ha sido modernizado
                // para usar sombras más suaves, bordes redondeados y transiciones.
                <AdCard
                  key={ad.id}
                  ad={ad}
                  seller={seller}
                  onSelect={() => onSelectAd(ad.id)}
                  currentUser={currentUser}
                />
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-xl">
              <div className="text-gray-300 mb-4">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                {searchQuery ? '😔 Vaya, no encontramos nada' : '🎉 ¡Sé el primero en publicar!'}
              </h3>
              <p className="text-gray-500 px-4">
                {searchQuery 
                  ? 'Intenta simplificar los términos de búsqueda o revisa la ortografía.'
                  : 'Aún no hay anuncios. ¡Anímate a crear uno ahora!'
                }
              </p>
            </div>
          )}
        </div>
      </main>

      {/* --- */}

      {/* Footer con degradado sutil */}
      <footer className="bg-gradient-to-r from-gray-50 to-blue-50 text-center py-10 mt-16 border-t border-gray-200">
        <h2 className="text-3xl font-extrabold text-blue-600 mb-2">JOLUB</h2>
        <p className="text-gray-600 text-sm mb-4">
          La plataforma moderna para comprar y vender de forma local y segura.
        </p>
        <p className="text-gray-500 text-xs">
          &copy; 2024 JOLUB. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;

