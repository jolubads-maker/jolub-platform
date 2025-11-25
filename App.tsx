import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Ad, User, ViewState, View, AdFormData, ChatLog, ChatMessage } from './types';
import { apiService } from './services/apiService';
import { OAUTH_CONFIG } from './config/oauth';
import { notify } from './services/notificationService';
import AdList from './components/AdList';
import AdDetail from './components/AdDetail';
import AdForm from './components/AdForm';
import ChatView from './components/ChatView';
import Login from './components/Login';
import OAuthLogin from './components/OAuthLogin';
import Register from './components/Register';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import UserCircleIcon from './components/icons/UserCircleIcon';
import LogoutIcon from './components/icons/LogoutIcon';

// Wrapper para AdDetail que obtiene los parámetros de la URL
const AdDetailWrapper: React.FC<{
  ads: Ad[];
  users: User[];
  currentUser: User | null;
  onStartChat: (sellerId: number) => void;
}> = ({ ads, users, currentUser, onStartChat }) => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();

  // Buscar el anuncio por uniqueCode (ej: AD-17613)
  // El usuario pidió formato /anuncio/iduncio(AD-17613), así que manejamos esa posibilidad
  // o simplemente el código directo.
  const ad = useMemo(() => {
    if (!uniqueCode) return undefined;
    // Intentar encontrar coincidencia exacta o dentro del string
    return ads.find(a => uniqueCode.includes(a.uniqueCode) || a.uniqueCode === uniqueCode);
  }, [ads, uniqueCode]);

  const seller = useMemo(() =>
    ad ? users.find(u => u.id === ad.sellerId) : undefined
    , [ad, users]);

  if (!ad || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Anuncio no encontrado</h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdDetail
      ad={ad}
      seller={seller}
      onBack={() => navigate('/')}
      onStartChat={onStartChat}
      currentUser={currentUser}
    />
  );
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [chatLogs, setChatLogs] = useState<Map<string, ChatLog>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Cargar datos iniciales de la base de datos
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersData, adsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAds()
        ]);

        setUsers(usersData);
        setAds(adsData);

        // Verificar token de sesión para detección automática
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) {
          try {
            const user = await apiService.authenticateWithToken(sessionToken);
            if (user) {
              setCurrentUser(user);
              await loadUserChats(user.id);
            }
          } catch (error) {
            console.error('Error verificando token de sesión:', error);
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('currentUser');
          }
        }

        // Fallback al método anterior si no hay token válido
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && !currentUser) {
          try {
            const user = JSON.parse(savedUser);
            const userInDb = usersData.find(u => u.id === user.id);
            if (userInDb) {
              setCurrentUser(userInDb);
              await loadUserChats(userInDb.id);
            }
          } catch (parseError) {
            console.error('Error parseando usuario guardado:', parseError);
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        notify.error('Error al cargar los datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar chats de un usuario
  const loadUserChats = async (userId: number) => {
    try {
      const userChats = await apiService.getUserChats(userId);
      const chatMap = new Map<string, ChatLog>();

      userChats.forEach((chatParticipant: any) => {
        const chat = chatParticipant.chat;
        chatMap.set(chat.id, {
          participantIds: chat.participants.map((p: any) => p.userId),
          messages: chat.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender as 'user' | 'seller' | 'buyer',
            userId: msg.userId,
            timestamp: new Date(msg.timestamp || new Date())
          })),
          lastMessage: chat.messages[0] ? {
            id: chat.messages[0].id,
            text: chat.messages[0].text,
            sender: chat.messages[0].sender as 'user' | 'seller' | 'buyer',
            userId: chat.messages[0].userId,
            timestamp: new Date(chat.messages[0].timestamp || new Date())
          } : undefined
        });
      });

      setChatLogs(chatMap);
    } catch (error) {
      console.error('Error cargando chats del usuario:', error);
    }
  };

  const handleSelectAd = useCallback(async (adId: number) => {
    try {
      // Incrementar vistas en la base de datos
      const updatedAd = await apiService.incrementAdViews(adId);
      setAds(prevAds =>
        prevAds.map(ad =>
          ad.id === adId ? updatedAd : ad
        )
      );

      // Navegar a la URL dinámica
      // Formato solicitado: /anuncio/iduncio(AD-17613)
      // Usaremos un formato limpio pero compatible: /anuncio/AD-XXXXX
      const ad = ads.find(a => a.id === adId);
      if (ad) {
        navigate(`/anuncio/${ad.uniqueCode}`);
      }
    } catch (error) {
      console.error('Error incrementando vistas:', error);
    }
  }, [ads, navigate]);

  const handleShowCreateForm = useCallback(() => {
    if (currentUser && !currentUser.phoneVerified) {
      notify.warning('Verifica tu celular para publicar anuncios');
      navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`);
      return;
    }
    navigate('/publicar');
  }, [currentUser, navigate]);

  // Removed duplicate async handleLogout; using simple version below

  const handleLogin = useCallback(async (userInfo: {
    name: string;
    avatar: string;
    email?: string;
    provider?: 'google' | 'apple' | 'manual';
    providerId?: string;
  }) => {
    try {
      setError(null);
      const user = await apiService.createOrUpdateUser(userInfo);
      const sessionToken = await apiService.generateSessionToken(user.id);
      const updatedUser = await apiService.updateUserOnlineStatus(user.id, true);

      setCurrentUser(updatedUser);
      setUsers(prevUsers => {
        const existing = prevUsers.find(u => u.id === updatedUser.id);
        if (existing) {
          return prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        }
        return [...prevUsers, updatedUser];
      });

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('sessionToken', sessionToken);

      await loadUserChats(updatedUser.id);

      navigate(`/dashboard/${updatedUser.uniqueId || 'USER-' + updatedUser.id}`);
      notify.success(`Bienvenido, ${user.name}!`);
    } catch (error: any) {
      console.error('❌ ERROR EN LOGIN:', error);
      const errorMessage = error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
      notify.error(errorMessage);
    }
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      // Actualizar estado en línea en la base de datos antes de cerrar sesión
      if (currentUser) {
        try {
          await apiService.updateUserOnlineStatus(currentUser.id, false);
        } catch (error) {
          console.error('Error actualizando estado offline:', error);
          // Continuar con el logout aunque falle la actualización
        }
      }

      // Limpiar datos de sesión
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('phoneVerification'); // Limpiar también datos de verificación

      // Limpiar estado
      setCurrentUser(null);
      setChatLogs(new Map());

      // Mostrar notificación
      notify.success('Sesión cerrada exitosamente');

      // Redirigir al home
      navigate('/');
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así, limpiar datos locales y redirigir
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('phoneVerification');
      setCurrentUser(null);
      setChatLogs(new Map());
      navigate('/');
      notify.error('Error al cerrar sesión, pero se limpiaron los datos locales');
    }
  }, [navigate, currentUser]);

  const handlePhoneVerified = useCallback(async (phoneNumber: string) => {
    if (!currentUser) return;

    try {
      setError(null);
      const updatedUser = await apiService.verifyUserPhone(currentUser.id, phoneNumber);

      setCurrentUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(u => (u.id === currentUser.id ? updatedUser : u)));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      notify.success('¡Teléfono verificado con éxito! Ya puedes crear anuncios.');
    } catch (error: any) {
      console.error('Error verificando teléfono:', error);
      const errorMessage = error?.message || 'Error al verificar el teléfono. Inténtalo de nuevo.';
      notify.error(errorMessage);
    }
  }, [currentUser]);

  const handleEmailVerified = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Recargar usuario del servidor para obtener el estado actualizado
      const updatedUser = await apiService.authenticateWithToken(localStorage.getItem('sessionToken') || '');
      if (updatedUser) {
        setCurrentUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        notify.success('¡Correo verificado con éxito!');
      }
    } catch (error) {
      console.error('Error actualizando estado de usuario:', error);
    }
  }, [currentUser]);

  const handleCreateAd = useCallback(async (formData: AdFormData) => {
    if (!currentUser) {
      notify.error('Debes iniciar sesión para crear anuncios');
      navigate('/login');
      return;
    }

    if (!currentUser.phoneVerified) {
      notify.warning('Verifica tu celular para publicar anuncios');
      navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`);
      return;
    }

    // Validar datos del formulario
    if (!formData.title || !formData.description || !formData.price || formData.price <= 0) {
      notify.error('Por favor, completa todos los campos requeridos con valores válidos.');
      return;
    }

    if (!formData.media || formData.media.length === 0) {
      notify.error('Debes agregar al menos una imagen o video al anuncio.');
      return;
    }

    try {
      setError(null);
      const newAd = await apiService.createAd({
        title: formData.title.trim(),
        description: formData.description.trim(),
        details: formData.details?.trim(),
        price: Math.round(formData.price * 100) / 100,
        sellerId: currentUser.id,
        media: formData.media
      });

      setAds(prevAds => [newAd, ...prevAds]);
      navigate('/');
      notify.success('¡Anuncio publicado exitosamente!');
    } catch (error: any) {
      console.error('Error creando anuncio:', error);
      const errorMessage = error?.message || 'Error al crear el anuncio. Inténtalo de nuevo.';
      notify.error(errorMessage);
    }
  }, [currentUser, navigate]);

  const handleStartChat = useCallback((sellerId: number) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.emailVerified) {
      notify.error('Confirma tu correo para contactar al vendedor');
      navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`);
      return;
    }
    const buyerId = currentUser.id;
    const chatId = [buyerId, sellerId].sort().join('-');

    const seller = users.find(u => u.id === sellerId);
    if (!seller || !seller.isOnline) {
      notify.info('El vendedor no está en línea en este momento. Inténtalo más tarde.');
      return;
    }

    if (!chatLogs.has(chatId)) {
      setChatLogs(prev => new Map(prev).set(chatId, {
        participantIds: [buyerId, sellerId],
        messages: [],
        lastMessage: undefined
      }));
    }

    navigate(`/chat/${chatId}`, { state: { sellerId, buyerId } });
  }, [currentUser, users, chatLogs, navigate]);

  // Memoizar anuncios del usuario
  const userAds = useMemo(() => {
    if (!currentUser) return [];
    return ads.filter(ad => ad.sellerId === currentUser.id);
  }, [ads, currentUser]);

  // Memoizar chats del usuario
  const userChats = useMemo(() => {
    if (!currentUser) return [];
    return Array.from(chatLogs.values()).filter(log =>
      (log as ChatLog).participantIds.includes(currentUser.id)
    );
  }, [chatLogs, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-xl">Cargando Marketplace IA...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={OAUTH_CONFIG.GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <Toaster position="top-center" richColors />
        {error && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <HomePage
              currentUser={currentUser}
              ads={ads}
              users={users}
              onSelectAd={handleSelectAd}
              onShowDashboard={() => navigate(`/dashboard/${currentUser?.uniqueId || 'USER-' + currentUser?.id}`)}
              onShowLogin={() => navigate('/login')}
              onShowRegister={() => navigate('/register')}
              onLogout={handleLogout}
              onCreateAd={handleShowCreateForm}
              onAdsUpdate={setAds}
            />
          } />

          <Route path="/anuncio/:uniqueCode" element={
            <AdDetailWrapper
              ads={ads}
              users={users}
              currentUser={currentUser}
              onStartChat={handleStartChat}
            />
          } />

          <Route path="/publicar" element={
            currentUser ? (
              <AdForm
                onCancel={() => navigate('/')}
                onSubmit={handleCreateAd}
              />
            ) : (
              <Navigate to="/login" />
            )
          } />

          <Route path="/login" element={
            <Login onLogin={handleLogin} />
          } />

          <Route path="/register" element={
            <Register
              onRegister={handleLogin}
              onBackToHome={() => navigate('/')}
              onError={(error) => notify.error(error)}
            />
          } />

          <Route path="/dashboard/:uniqueId" element={
            currentUser ? (
              <Dashboard
                currentUser={currentUser}
                userAds={userAds}
                userChats={userChats}
                users={users}
                onPhoneVerified={handlePhoneVerified}
                onEmailVerified={handleEmailVerified}
                onOpenChat={(otherUserId) => handleStartChat(otherUserId)}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" />
            )
          } />

          <Route path="/chat/:chatId" element={
            <ChatRouteWrapper
              users={users}
              currentUser={currentUser}
              chatLogs={chatLogs}
              setChatLogs={setChatLogs}
              navigate={navigate}
            />
          } />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
};

// Componente auxiliar para la ruta de chat
const ChatRouteWrapper: React.FC<{
  users: User[];
  currentUser: User | null;
  chatLogs: Map<string, ChatLog>;
  setChatLogs: React.Dispatch<React.SetStateAction<Map<string, ChatLog>>>;
  navigate: any;
}> = ({ users, currentUser, chatLogs, setChatLogs, navigate }) => {
  const { chatId } = useParams();
  const location = useLocation();
  const state = location.state as { sellerId?: number, buyerId?: number } | null;

  if (!currentUser || !chatId) return <Navigate to="/" />;

  const chatLog = chatLogs.get(chatId);
  // Si no hay log pero tenemos sellerId en state, podemos intentar reconstruirlo o esperar
  // Por simplicidad, si no hay log y venimos de "StartChat", ya debería haberse creado en App.

  if (!chatLog && !state?.sellerId) {
    return <Navigate to="/" />;
  }

  const sellerId = state?.sellerId || (chatLog?.participantIds.find(id => id !== currentUser.id));
  const chatSeller = users.find(u => u.id === sellerId);

  if (!chatSeller) return <div>Error: Vendedor no encontrado</div>;

  return (
    <ChatView
      seller={chatSeller}
      buyer={currentUser}
      onBack={() => navigate(`/dashboard/${currentUser?.uniqueId || 'USER-' + currentUser?.id}`)}
      chatLog={chatLog || { participantIds: [currentUser.id, chatSeller.id], messages: [], lastMessage: undefined }}
      onSendMessage={async (message) => {
        try {
          const newMessage = await apiService.sendMessage(
            chatId,
            currentUser.id,
            message,
            currentUser.id === chatSeller.id ? 'seller' : 'buyer'
          );

          setChatLogs(prev => {
            const updated = new Map(prev);
            const currentChat = updated.get(chatId);
            if (currentChat) {
              const chat = currentChat as ChatLog;
              updated.set(chatId, {
                ...chat,
                messages: [...chat.messages, newMessage],
                lastMessage: newMessage
              });
            } else {
              updated.set(chatId, {
                participantIds: [currentUser.id, chatSeller.id],
                messages: [newMessage],
                lastMessage: newMessage
              });
            }
            return updated;
          });
        } catch (error) {
          console.error('Error enviando mensaje:', error);
          notify.error('Error al enviar el mensaje.');
        }
      }}
    />
  );
};

export default App;