import React, { useEffect, useMemo, Suspense, lazy } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Ad, User, ChatLog } from './src/types';
import { OAUTH_CONFIG } from './config/oauth';
import { notify } from './services/notificationService';

// Lazy load components
const AdDetail = lazy(() => import('./components/AdDetail'));
const AdForm = lazy(() => import('./components/AdForm'));
const ChatView = lazy(() => import('./components/ChatView'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const HomePage = lazy(() => import('./components/HomePage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const ConnectionStatus = lazy(() => import('./components/ConnectionStatus'));

// Admin Components
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const DashboardOverview = lazy(() => import('./components/admin/DashboardOverview'));
const UsersTable = lazy(() => import('./components/admin/UsersTable'));
const AdsTable = lazy(() => import('./components/admin/AdsTable'));

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#6e0ad6] text-white font-sans flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-xl font-bold tracking-widest">Cargando JOLUB...</p>
    </div>
  </div>
);

// Stores
import { useAuthStore } from './store/useAuthStore';
import { useAdStore } from './store/useAdStore';
import { useChatStore } from './store/useChatStore';

// Wrapper para AdDetail que obtiene los parámetros de la URL
const AdDetailWrapper: React.FC = () => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const { ads, loading, fetchAdByUniqueCode } = useAdStore();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (uniqueCode) {
      fetchAdByUniqueCode(uniqueCode);
    }
  }, [uniqueCode]);

  // Buscar el anuncio por uniqueCode (ej: AD-17613)
  const ad = useMemo(() => {
    if (!uniqueCode) return undefined;
    return ads.find(a => uniqueCode.includes(a.uniqueCode) || a.uniqueCode === uniqueCode);
  }, [ads, uniqueCode]);

  const seller = useMemo(() => ad?.seller, [ad]);

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

  if (loading && !ad) {
    return <LoadingScreen />;
  }

  if (!ad || !seller) {
    // Si no está cargando y no hay anuncio, mostrar error
    if (!loading) {
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
    return <LoadingScreen />;
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
  const authError = useAuthStore(state => state.error);
  const setAuthError = useAuthStore(state => state.setError);

  const { fetchAds, loading: adsLoading } = useAdStore();
  const loadUserChats = useChatStore(state => state.loadUserChats);

  const navigate = useNavigate();

  // Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      // 1. Verificar sesión primero (Bloqueante para la UI)
      await verifySession();

      // 2. Cargar datos en segundo plano (No bloqueante)
      fetchAds();
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
        <ConnectionStatus />
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

        <Suspense fallback={<LoadingScreen />}>
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

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="users" element={<UsersTable />} />
              <Route path="ads" element={<AdsTable />} />
            </Route>
          </Routes>
        </Suspense>
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

  const { currentUser, getUserById } = useAuthStore();
  const chatLogs = useChatStore(state => state.chatLogs);
  const sendMessage = useChatStore(state => state.sendMessage);
  const addMessage = useChatStore(state => state.addMessage);

  if (!currentUser || !chatId) return <Navigate to="/" />;

  const chatLog = chatLogs.get(chatId);

  if (!chatLog && !state?.sellerId) {
    return <Navigate to="/" />;
  }

  const sellerId = state?.sellerId || (chatLog?.participantIds.find(id => id !== currentUser.id));
  const [chatSeller, setChatSeller] = React.useState<User | undefined>(undefined);

  React.useEffect(() => {
    if (sellerId) {
      getUserById(sellerId).then(setChatSeller);
    }
  }, [sellerId]);

  if (!chatSeller) return <LoadingScreen />;

  return (
    <ChatView
      seller={chatSeller}
      buyer={currentUser}
      onBack={() => navigate(`/dashboard/${currentUser?.uniqueId || 'USER-' + currentUser?.id}`)}
      chatLog={chatLog || { id: chatId, participantIds: [currentUser.id, chatSeller.id], messages: [], lastMessage: undefined, updatedAt: new Date() }}
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
