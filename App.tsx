import React, { useState, useCallback, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Ad, User, ViewState, View, AdFormData, ChatLog, ChatMessage } from './types';
import { apiService } from './services/apiService';
import { OAUTH_CONFIG } from './config/oauth';
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

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ view: View.List });
  const [chatLogs, setChatLogs] = useState<Map<string, ChatLog>>(new Map());
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales de la base de datos
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
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
              return;
            }
          } catch (error) {
            console.error('Error verificando token de sesión:', error);
            localStorage.removeItem('sessionToken');
          }
        }
        
        // Fallback al método anterior si no hay token válido
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          const userInDb = usersData.find(u => u.id === user.id);
          if (userInDb) {
            setCurrentUser(userInDb);
            await loadUserChats(userInDb.id);
          }
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
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
    } catch (error) {
      console.error('Error incrementando vistas:', error);
    }
    setViewState({ view: View.Detail, adId });
  }, []);

  const handleBackToList = useCallback(() => setViewState({ view: View.List }), []);
  
  const handleShowCreateForm = useCallback(() => {
    if (currentUser && !currentUser.phoneVerified) {
      alert('Por favor, verifica tu número de teléfono en el panel de control para poder publicar anuncios.');
      const uniqueId = currentUser.uniqueId || `USER-${currentUser.id}`;
      setViewState({ view: View.Dashboard, userId: currentUser.id, uniqueId: uniqueId });
      return;
    }
    setViewState({ view: View.Create });
  }, [currentUser]);

  const handleShowLogin = useCallback(() => setViewState({ view: View.Login }), []);
  const handleShowRegister = useCallback(() => setViewState({ view: View.Register }), []);
  const handleShowDashboard = useCallback(() => {
    if (currentUser) {
      const uniqueId = currentUser.uniqueId || `USER-${currentUser.id}`;
      setViewState({ view: View.Dashboard, userId: currentUser.id, uniqueId: uniqueId });
    }
  }, [currentUser]);
  const handleBackToHome = useCallback(() => setViewState({ view: View.List }), []);

  const handleLogout = useCallback(async () => {
    if (currentUser) {
      try {
        // Actualizar estado en línea en la base de datos
        await apiService.updateUserOnlineStatus(currentUser.id, false);
      } catch (error) {
        console.error('Error actualizando estado offline:', error);
      }
    }
    
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
    setChatLogs(new Map());
    setViewState({ view: View.List });
  }, [currentUser]);
  
  const handleLogin = useCallback(async (userInfo: { 
    name: string; 
    avatar: string; 
    email?: string;
    provider?: 'google' | 'apple' | 'manual';
    providerId?: string;
  }) => {
    try {
      console.log('🔵 [1/5] Iniciando proceso de login/registro...', userInfo);
      
      // Crear o actualizar usuario en la base de datos
      console.log('🔵 [2/5] Creando/actualizando usuario en BD...');
      const user = await apiService.createOrUpdateUser(userInfo);
      console.log('✅ [2/5] Usuario creado/actualizado:', user);
      
      // Generar token de sesión
      console.log('🔵 [3/5] Generando token de sesión...');
      const sessionToken = await apiService.generateSessionToken(user.id);
      console.log('✅ [3/5] Token generado:', sessionToken.substring(0, 20) + '...');
      
      // Actualizar estado en línea
      console.log('🔵 [4/5] Actualizando estado en línea...');
      const updatedUser = await apiService.updateUserOnlineStatus(user.id, true);
      console.log('✅ [4/5] Estado actualizado:', updatedUser);
      
      setCurrentUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      // Guardar usuario y token en localStorage para persistencia
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('sessionToken', sessionToken);
      
      // Cargar chats del usuario
      console.log('🔵 [5/5] Cargando chats del usuario...');
      await loadUserChats(updatedUser.id);
      console.log('✅ [5/5] Chats cargados');
      
      // Redirigir al dashboard dinámico con ID único
      const uniqueId = updatedUser.uniqueId || `USER-${updatedUser.id}`;
      console.log('🚀 Redirigiendo al dashboard dinámico...');
      setViewState({ 
        view: View.Dashboard, 
        userId: updatedUser.id,
        uniqueId: uniqueId
      });
      
      console.log(`✅ ¡LOGIN EXITOSO! Usuario: ${updatedUser.name} (ID: ${uniqueId})`);
    } catch (error) {
      console.error('❌ ERROR EN LOGIN:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
      alert('Error al iniciar sesión. Inténtalo de nuevo.');
    }
  }, []);

  const handlePhoneVerified = useCallback(async (phoneNumber: string) => {
    if (!currentUser) return;
    
    try {
      // Verificar teléfono en la base de datos
      const updatedUser = await apiService.verifyUserPhone(currentUser.id, phoneNumber);
      
      setCurrentUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
      
      // Actualizar localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      alert('¡Teléfono verificado con éxito! Ya puedes crear anuncios.');
    } catch (error) {
      console.error('Error verificando teléfono:', error);
      alert('Error al verificar el teléfono. Inténtalo de nuevo.');
    }
  }, [currentUser]);

  const handleOpenChatFromDashboard = useCallback((otherUserId: number) => {
    if (!currentUser) return;
    const buyerId = currentUser.id;
    const sellerId = otherUserId;
    const chatId = [buyerId, sellerId].sort().join('-');

    // Asegurar que el chat exista en logs (por si aún no fue iniciado)
    if (!chatLogs.has(chatId)) {
      setChatLogs(prev => new Map(prev).set(chatId, {
        participantIds: [buyerId, sellerId],
        messages: [],
        lastMessage: undefined
      }));
    }

    setViewState({ view: View.Chat, sellerId, buyerId, chatId, from: 'dashboard' });
  }, [currentUser, chatLogs]);



  const handleCreateAd = useCallback(async (formData: AdFormData) => {
    if (!currentUser) return;
    
    try {
      // Crear anuncio en la base de datos
      const newAd = await apiService.createAd({
        title: formData.title,
        description: formData.description,
        details: formData.details,
        price: formData.price,
        sellerId: currentUser.id,
        media: formData.media
      });
      
      setAds(prevAds => [newAd, ...prevAds]);
      setViewState({ view: View.List });
    } catch (error) {
      console.error('Error creando anuncio:', error);
      alert('Error al crear el anuncio. Inténtalo de nuevo.');
    }
  }, [currentUser]);

  const handleStartChat = useCallback((sellerId: number) => {
    if (!currentUser) {
      handleShowLogin();
      return;
    }
    const buyerId = currentUser.id;
    const chatId = [buyerId, sellerId].sort().join('-');
    
    // Verificar si el vendedor está en línea
    const seller = users.find(u => u.id === sellerId);
    if (!seller || !seller.isOnline) {
      alert('El vendedor no está en línea en este momento. Inténtalo más tarde.');
      return;
    }
    
    if (!chatLogs.has(chatId)) {
      setChatLogs(prev => new Map(prev).set(chatId, { 
        participantIds: [buyerId, sellerId],
        messages: [],
        lastMessage: undefined
      }));
    }
    
    setViewState({ view: View.Chat, sellerId, buyerId, chatId });
  }, [currentUser, users, chatLogs, handleShowLogin]);

  const renderContent = () => {
    switch (viewState.view) {
      case View.Detail:
        const ad = ads.find(a => a.id === viewState.adId);
        const seller = users.find(u => u.id === ad?.sellerId);
        if (!ad || !seller) {
            handleBackToList();
            return null;
        }
        return <AdDetail ad={ad} seller={seller} onBack={handleBackToList} onStartChat={handleStartChat} currentUser={currentUser} />;
      
      case View.Create:
        return <AdForm onCancel={handleBackToList} onSubmit={handleCreateAd} />;

      case View.Chat:
        const chatSeller = users.find(u => u.id === viewState.sellerId);
        const chatLog = chatLogs.get(viewState.chatId);
        if (!chatSeller || !currentUser || !chatLog) {
            handleBackToList();
            return null;
        }
        return <ChatView 
          seller={chatSeller} 
          buyer={currentUser} 
          onBack={() => {
            if (viewState.from === 'dashboard') {
              const uniqueId = currentUser.uniqueId || `USER-${currentUser.id}`;
              setViewState({ view: View.Dashboard, userId: currentUser.id, uniqueId: uniqueId });
            } else {
              handleBackToList();
            }
          }} 
          chatLog={chatLog}
          onSendMessage={async (message) => {
            try {
              // Enviar mensaje a la base de datos
              const newMessage = await apiService.sendMessage(
                viewState.chatId,
                currentUser.id,
                message,
                currentUser.id === viewState.sellerId ? 'seller' : 'buyer'
              );

              // Actualizar estado local
              setChatLogs(prev => {
                const updated = new Map(prev);
                const currentChat = updated.get(viewState.chatId) as ChatLog | undefined;
                if (currentChat) {
                  updated.set(viewState.chatId, {
                    participantIds: currentChat.participantIds,
                    messages: [...currentChat.messages, newMessage],
                    lastMessage: newMessage
                  });
                }
                return updated;
              });

              // Simular respuesta automática del vendedor si está en línea
              if (currentUser.id !== viewState.sellerId && chatSeller?.isOnline) {
                setTimeout(async () => {
                  try {
                    const responses = [
                      "¡Hola! Gracias por tu interés en mi producto.",
                      "¿Te gustaría hacer alguna pregunta específica?",
                      "El producto está en excelente estado.",
                      "¿Te interesa verlo en persona?",
                      "Puedo hacerte un descuento si lo compras hoy.",
                      "¿Necesitas más información sobre el producto?"
                    ];
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    
                    const sellerResponse = await apiService.sendMessage(
                      viewState.chatId,
                      viewState.sellerId,
                      randomResponse,
                      'seller'
                    );
                    
                    setChatLogs(prev => {
                      const updated = new Map(prev);
                      const currentChat = updated.get(viewState.chatId) as ChatLog | undefined;
                      if (currentChat) {
                        updated.set(viewState.chatId, {
                          participantIds: currentChat.participantIds,
                          messages: [...currentChat.messages, sellerResponse],
                          lastMessage: sellerResponse
                        });
                      }
                      return updated;
                    });
                  } catch (error) {
                    console.error('Error enviando respuesta automática:', error);
                  }
                }, 1000 + Math.random() * 2000); // Respuesta entre 1-3 segundos
              }
            } catch (error) {
              console.error('Error enviando mensaje:', error);
              alert('Error al enviar el mensaje. Inténtalo de nuevo.');
            }
          }}
        />;
      
      case View.Login:
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
              <OAuthLogin 
                onLogin={handleLogin}
                onError={(error) => alert(error)}
              />
            </div>
          </div>
        );
      
      case View.Register:
        return (
          <Register 
            onRegister={handleLogin}
            onBackToHome={handleBackToHome}
            onError={(error) => alert(error)}
          />
        );

      case View.Dashboard:
        if (!currentUser) {
          handleShowLogin();
          return null;
        }
        return <Dashboard 
                  currentUser={currentUser} 
                  userAds={ads.filter(ad => ad.sellerId === currentUser.id)} 
                  userChats={Array.from(chatLogs.values()).filter(log => (log as ChatLog).participantIds.includes(currentUser.id))}
                  users={users}
                  onPhoneVerified={handlePhoneVerified}
                  onOpenChat={handleOpenChatFromDashboard}
               />;

      case View.List:
      default:
        return <HomePage 
          currentUser={currentUser}
          ads={ads}
          users={users}
          onSelectAd={handleSelectAd}
          onShowDashboard={handleShowDashboard}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
          onLogout={handleLogout}
          onCreateAd={handleShowCreateForm}
          onAdsUpdate={setAds}
        />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-xl">Cargando Marketplace IA...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={OAUTH_CONFIG.GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        {renderContent()}
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;