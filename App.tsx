import React, { useEffect, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Ad, User, ChatLog } from './types';
import { OAUTH_CONFIG } from './config/oauth';
import { notify } from './services/notificationService';
import AdDetail from './components/AdDetail';
import AdForm from './components/AdForm';
import ChatView from './components/ChatView';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';

// Stores
import { useAuthStore } from './store/useAuthStore';
import { useAdStore } from './store/useAdStore';
import { useChatStore } from './store/useChatStore';

// Wrapper para AdDetail que obtiene los parámetros de la URL
const AdDetailWrapper: React.FC = () => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const { ads } = useAdStore();
  const { users } = useAuthStore();
  const { currentUser } = useAuthStore();

  // Buscar el anuncio por uniqueCode (ej: AD-17613)
  const ad = useMemo(() => {
    if (!uniqueCode) return undefined;
    return ads.find(a => uniqueCode.includes(a.uniqueCode) || a.uniqueCode === uniqueCode);
  }, [ads, uniqueCode]);

  const seller = useMemo(() =>
    ad ? users.find(u => u.id === ad.sellerId) : undefined
    , [ad, users]);

  const handleStartChat = (sellerId: number) => {
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
    navigate(`/chat/${chatId}`, { state: { sellerId, buyerId } });
  };

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
      onStartChat={handleStartChat}
      currentUser={currentUser}
    />
  );
};

const App: React.FC = () => {
  const currentUser = useAuthStore(state => state.currentUser);
  const authLoading = useAuthStore(state => state.loading);
  const isCheckingSession = useAuthStore(state => state.isCheckingSession);
  const verifySession = useAuthStore(state => state.verifySession);
  const fetchUsers = useAuthStore(state => state.fetchUsers);
  const authError = useAuthStore(state => state.error);
  const setAuthError = useAuthStore(state => state.setError);

  const { fetchAds, loading: adsLoading } = useAdStore();
  const { loadUserChats } = useChatStore();

  const navigate = useNavigate();

  // Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchUsers(),
        fetchAds(),
        verifySession()
      ]);
    };
    init();
  }, []);

  // Cargar chats cuando cambia el usuario
  useEffect(() => {
    if (currentUser) {
      loadUserChats(currentUser.id);
    }
  }, [currentUser]);

  // Show loader while checking session OR while initial data loads
  if (isCheckingSession || (authLoading && !currentUser)) {
    return (
      <div className="min-h-screen bg-[#6e0ad6] text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold tracking-widest">Cargando JOLUB......</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={OAUTH_CONFIG.GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <Toaster position="top-center" richColors />
        {authError && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md">
            <span>{authError}</span>
            <button
              onClick={() => setAuthError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        )}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/anuncio/:uniqueCode" element={<AdDetailWrapper />} />

          <Route path="/publicar" element={
            currentUser ? (
              <AdForm
                onCancel={() => navigate('/')}
                onSubmit={async (data) => {
                  try {
                    await useAdStore.getState().createAd({
                      ...data,
                      sellerId: currentUser.id
                    });
                    navigate('/');
                    notify.success('¡Anuncio publicado exitosamente!');
                  } catch (e: any) {
                    notify.error(e.message || 'Error al crear anuncio');
                  }
                }}
              />
            ) : (
              <Navigate to="/login" />
            )
          } />

          <Route path="/login" element={
            <Login onLogin={async (data) => {
              try {
                const user = await useAuthStore.getState().login(data);
                if (user) {
                  navigate(`/dashboard/${user.uniqueId || 'USER-' + user.id}`);
                  notify.success(`Bienvenido, ${user.name}!`);
                }
              } catch (e: any) {
                notify.error(e.message || 'Error al iniciar sesión');
              }
            }} />
          } />

          <Route path="/register" element={
            <Register
              onRegister={async (data) => {
                try {
                  const user = await useAuthStore.getState().login(data);
                  if (user) {
                    navigate(`/dashboard/${user.uniqueId || 'USER-' + user.id}`);
                    notify.success(`Bienvenido, ${user.name}!`);
                  }
                } catch (e: any) {
                  notify.error(e.message || 'Error al registrarse');
                }
              }}
              onBackToHome={() => navigate('/')}
              onError={(error) => notify.error(error)}
            />
          } />

          <Route path="/dashboard/:uniqueId" element={
            currentUser ? <Dashboard /> : <Navigate to="/login" />
          } />

          <Route path="/chat/:chatId" element={<ChatRouteWrapper />} />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
};

// Componente auxiliar para la ruta de chat
const ChatRouteWrapper: React.FC = () => {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { sellerId?: number, buyerId?: number } | null;

  const { currentUser, users } = useAuthStore();
  const { chatLogs, sendMessage, addMessage } = useChatStore();

  if (!currentUser || !chatId) return <Navigate to="/" />;

  const chatLog = chatLogs.get(chatId);

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
          await sendMessage(chatId, currentUser.id, message, currentUser.id === chatSeller.id ? 'seller' : 'buyer');
        } catch (error) {
          console.error('Error enviando mensaje:', error);
          notify.error('Error al enviar el mensaje.');
        }
      }}
    />
  );
};

export default App;