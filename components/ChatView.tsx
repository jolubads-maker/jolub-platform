import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog, Ad } from '../src/types';
import SendIcon from './icons/SendIcon';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/api.config';
import { useChatStore } from '../store/useChatStore';
import { apiService } from '../services/apiService';

// X Icon Component
const XMarkIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface ChatViewProps {
  seller: User;
  buyer: User;
  onBack: () => void;
  chatLog?: ChatLog; // Make optional as we might create it
  onSendMessage?: (message: string) => void;
  isOverlay?: boolean;
  ad?: Ad; // Optional ad context
  onClose?: () => void; // Optional close handler for drawer
}

const ChatView: React.FC<ChatViewProps> = ({ seller, buyer, onBack, chatLog: initialChatLog, onSendMessage, isOverlay = false, ad, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [chatLog, setChatLog] = useState<ChatLog | undefined>(initialChatLog);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatLog?.messages || []);
  const [isBlocked, setIsBlocked] = useState(initialChatLog?.isBlocked || false);
  const [blockedBy, setBlockedBy] = useState<number | null>(initialChatLog?.blockedBy || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fetchMessages = useChatStore(state => state.fetchMessages);
  const markAsRead = useChatStore(state => state.markAsRead);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(!initialChatLog);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Initialize Chat (Check if exists, don't create yet)
  useEffect(() => {
    const initChat = async () => {
      if (!chatLog && seller && buyer) {
        try {
          setIsLoading(true);
          // Check if chat exists without creating it
          const existingChat = await apiService.createOrGetChat([buyer.id, seller.id], ad?.id, { checkOnly: true });

          if (existingChat) {
            // Ensure participantIds is populated from participants if missing
            const chatData = {
              ...existingChat,
              participantIds: existingChat.participantIds || existingChat.participants?.map((p: any) => p.userId) || []
            };
            setChatLog(chatData);
            setMessages(chatData.messages || []);
            setIsBlocked(chatData.isBlocked || false);
            setBlockedBy(chatData.blockedBy || null);
          } else {
            // Draft mode: Create a temporary chatLog object
            const sortedIds = [buyer.id, seller.id].sort((a, b) => a - b);
            const draftId = sortedIds.join('-');
            setChatLog({
              id: draftId,
              participantIds: sortedIds,
              messages: [],
              updatedAt: new Date(),
              ad: ad ? {
                id: ad.id,
                uniqueCode: ad.uniqueCode,
                title: ad.title,
                price: ad.price,
                media: ad.media || []
              } : undefined
            });
          }
        } catch (error) {
          console.error("Error initializing chat:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initChat();
  }, [seller, buyer, ad, chatLog]);

  // Sync state with props when initialChatLog changes (e.g. from Dashboard)
  useEffect(() => {
    if (initialChatLog) {
      setChatLog(initialChatLog);
      setMessages(initialChatLog.messages || []);
      setIsBlocked(initialChatLog.isBlocked || false);
      setBlockedBy(initialChatLog.blockedBy || null);
    }
  }, [initialChatLog]);

  // Sincronizar mensajes si cambian las props (carga inicial) y buscar historial completo
  useEffect(() => {
    if (chatLog && chatLog.id) {
      // Only fetch history if it's a real chat (not draft) - checking if we have messages or if we know it exists
      // Actually, we can try to fetch, but if it's draft it will return empty or 404.
      // Better to rely on the initChat check.

      if (messages.length > 0) {
        // Don't overwrite if we already have messages from prop sync above
        // setMessages(chatLog.messages || []); 
      }
      setIsBlocked(chatLog.isBlocked || false);
      setBlockedBy(chatLog.blockedBy || null);

      // Buscar historial completo del servidor para este chat
      const loadHistory = async () => {
        if (chatLog.id) {
          console.log('🔄 Cargando historial completo para chat:', chatLog.id);
          await fetchMessages(chatLog.id);
          // Mark as read locally immediately
          markAsRead(chatLog.id);
        }
      };
      loadHistory();
    }
  }, [chatLog?.id, fetchMessages, markAsRead]);

  // Update messages state when store updates
  useEffect(() => {
    if (chatLog && chatLog.messages && chatLog.messages.length > messages.length) {
      setMessages(chatLog.messages);
      markAsRead(chatLog.id);
    }
  }, [chatLog?.messages, markAsRead, chatLog?.id]);

  useEffect(() => {
    if (!chatLog) return;

    // Inicializar conexión de Socket.io usando la URL correcta
    const socketUrl = getSocketUrl();
    console.log('🔌 Conectando socket a:', socketUrl);

    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      auth: {
        token: buyer.sessionToken
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado:', socketRef.current?.id);
      socketRef.current?.emit('join_chat', chatLog.id);
      socketRef.current?.emit('mark_read', { chatId: chatLog.id, userId: buyer.id });
      markAsRead(chatLog.id); // Update local store
    });

    socketRef.current.on('receive_message', (newMessage: ChatMessage) => {
      console.log('📩 [CLIENT] Mensaje recibido del servidor:', newMessage);
      setMessages((prevMessages) => {
        if (prevMessages.some(m => m.id === newMessage.id)) return prevMessages;
        return [...prevMessages, newMessage];
      });

      socketRef.current?.emit('mark_read', { chatId: chatLog.id, userId: buyer.id });
      markAsRead(chatLog.id); // Update local store
      // Auto-scroll on new message
      setTimeout(scrollToBottom, 100);
    });

    socketRef.current.on('messages_read', (data: { chatId: string, readerId: number }) => {
      if (data.chatId === chatLog.id && data.readerId !== buyer.id) {
        setMessages(prev => prev.map(msg =>
          msg.userId === buyer.id ? { ...msg, isRead: true } : msg
        ));
      }
    });

    socketRef.current.on('chat_blocked', (data: { chatId: string, blockedBy: number }) => {
      if (data.chatId === chatLog.id) {
        setIsBlocked(true);
        setBlockedBy(data.blockedBy);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatLog?.id, buyer.id, markAsRead]);

  // Only scroll to bottom if the last message is from current user (sent) or if it's initial load
  useEffect(() => {
    if (initialLoad && messages.length > 0) {
      scrollToBottom(false);
      setInitialLoad(false);
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.userId === buyer.id) {
        scrollToBottom();
      }
    }
  }, [messages, initialLoad, buyer.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatLog) return;

    console.log('handleSendMessage chatLog:', chatLog);
    console.log('handleSendMessage participantIds:', chatLog.participantIds);
    console.log('handleSendMessage adId:', ad?.id);

    // Ensure chat exists in DB before sending via socket
    // If it was a draft, create it now
    try {
      // We can optimistically send, but socket logic might fail if chat doesn't exist.
      // Or we can ensure creation here.
      // Since we modified createOrGetChat to support checkOnly, we can call it with checkOnly: false
      // to ensure it exists.
      await apiService.createOrGetChat(chatLog.participantIds, ad?.id, { checkOnly: false });
    } catch (err) {
      console.error("Error ensuring chat exists:", err);
      return; // Don't send if creation failed
    }

    if (socketRef.current) {
      const messageData = {
        chatId: chatLog.id,
        userId: buyer.id,
        text: inputValue,
        sender: 'buyer'
      };

      socketRef.current.emit('send_message', messageData, (response: any) => {
        if (response.status !== 'ok') {
          if (response.error === 'Chat is blocked') {
            setIsBlocked(true);
            alert('No puedes enviar mensajes porque el chat está bloqueado.');
          }
        }
      });
    }

    setInputValue('');
    if (onSendMessage) onSendMessage(inputValue);
  };

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(10);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  // Ad Detail Modal State
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const handleBlockToggle = () => {
    if (isBlocked && blockedBy === buyer.id) {
      setIsBlocked(false);
      setBlockedBy(null);
      // TODO: Persist unblock in backend
    } else if (!isBlocked) {
      if (window.confirm(`¿Estás seguro de bloquear a ${seller.name}?`)) {
        setIsBlocked(true);
        setBlockedBy(buyer.id);
        // TODO: Persist block in backend
      }
    }
  };

  const handleRateUser = async () => {
    if (isRatingSubmitting) return;
    setIsRatingSubmitting(true);
    try {
      await apiService.rateUser(seller.id, rating);
      alert(`¡Gracias! Has calificado a ${seller.name} con ${rating} puntos.`);
      setShowRatingModal(false);
    } catch (error) {
      console.error('Error rating user:', error);
      alert('Error al enviar la calificación.');
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else onBack();
  }

  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-50 flex justify-end ${isOverlay ? 'bg-black/60 backdrop-blur-sm' : 'liquid-bg'}`}>
        <div className="w-full md:w-[450px] h-full bg-[#0b141a]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="text-white mt-4">Iniciando chat...</p>
        </div>
      </div>
    )
  }

  return (
    // Full screen liquid background container (Page Background)
    <div className={`fixed inset-0 z-50 flex justify-end ${isOverlay ? 'bg-black/60 backdrop-blur-sm' : 'liquid-bg'}`}>

      {/* Chat Drawer - Right Aligned */}
      <div className="w-full md:w-[450px] h-full bg-[#0b141a]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex flex-col bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center p-4 justify-between">
            <div className="flex items-center">
              <div className="relative cursor-pointer mr-3">
                <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                {seller.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b141a] bg-green-400"></div>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{seller.name}</h2>
                <p className="text-xs text-white/60">
                  {seller.isOnline ? 'En línea' : 'Desconectado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Block Button */}
              <button
                onClick={handleBlockToggle}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${isBlocked && blockedBy === buyer.id
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                disabled={isBlocked && blockedBy !== buyer.id}
              >
                {isBlocked && blockedBy === buyer.id ? 'Desbloquear' : 'Bloquear'}
              </button>

              {/* Close Button (X) */}
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Ad Context Header */}
          {ad && (
            <div className="px-4 pb-4 pt-0 flex items-center gap-3 bg-white/5 mx-4 mb-4 rounded-xl border border-white/10 relative group">
              {ad.media && ad.media.length > 0 && (
                <img src={ad.media[0].url} alt={ad.title} className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0 py-2">
                <h3 className="text-sm font-bold text-white truncate">{ad.title}</h3>
                <p className="text-xs text-[#d9520b] font-bold">${ad.price.toLocaleString()} USD</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdDetailModal(true)}
                  className="px-3 py-1 bg-[#6e0ad6] hover:bg-[#5b08b0] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Ver
                </button>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Clasificar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="flex flex-col space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 inline-block mb-4 shadow-sm border border-white/10">
                  <p className="text-white/80 text-sm">
                    🔒 Mensajes cifrados de extremo a extremo.
                  </p>
                </div>
                <p className="text-white/60 text-sm mt-4">Saluda a {seller.name} 👋</p>
                {ad && (
                  <p className="text-white/40 text-xs mt-2">Interesado en: {ad.title}</p>
                )}
              </div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = msg.userId === buyer.id;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}
                  >
                    <div
                      className={`relative max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isCurrentUser
                        ? 'bg-[#4b0997] text-white rounded-tr-sm' // Usuario: Purple
                        : 'bg-[#d9520b] text-white rounded-tl-sm' // Otro: Orange
                        }`}
                    >
                      <p className="break-words leading-relaxed">{msg.text}</p>
                      <div className={`flex justify-end items-center space-x-1 mt-1 opacity-70`}>
                        <span className="text-[10px] min-w-fit">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isCurrentUser && (
                          <span className={`text-[11px] ${msg.isRead ? 'text-blue-300' : 'text-white'}`}>
                            {/* Doble check */}
                            <svg viewBox="0 0 16 15" width="16" height="15" className="">
                              <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-7.655a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-7.655a.365.365 0 0 0-.063-.51z"></path>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-black/20 backdrop-blur-md border-t border-white/10">
          {isBlocked ? (
            <div className="w-full p-4 bg-black/40 text-center rounded-lg border border-red-500/30">
              <p className="text-red-400 font-bold text-sm">
                {blockedBy === buyer.id
                  ? 'Has bloqueado a este usuario.'
                  : 'Has sido bloqueado por el usuario.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <div className="flex-1 bg-white/5 rounded-full flex items-center px-4 py-2 border border-white/10 focus-within:bg-white/10 transition-colors">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`p-3 rounded-full transition-all transform hover:scale-105 flex items-center justify-center ${inputValue.trim()
                  ? 'bg-[#4b0997] hover:bg-[#5b06b6] text-white shadow-lg shadow-purple-900/50'
                  : 'bg-white/10 text-white/30 cursor-default'
                  }`}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* RATING MODAL */}
      {showRatingModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-xl font-black text-gray-800 mb-2">Clasificar Vendedor</h3>
            <p className="text-gray-500 text-sm mb-6">¿Qué tal fue tu experiencia con {seller.name}?</p>

            <div className="flex justify-center gap-2 mb-8">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  className={`w-8 h-8 rounded-full font-bold text-sm transition-all ${rating === i
                      ? 'bg-[#6e0ad6] text-white scale-110 shadow-lg'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {i}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRateUser}
                disabled={isRatingSubmitting}
                className="flex-1 py-3 bg-[#6e0ad6] text-white font-bold rounded-xl hover:bg-[#5b08b0] transition-colors shadow-lg disabled:opacity-50"
              >
                {isRatingSubmitting ? 'Enviando...' : 'Enviar Puntos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AD DETAIL MODAL */}
      {showAdDetailModal && ad && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in relative">
            <button
              onClick={() => setShowAdDetailModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="h-64 bg-gray-900 relative flex items-center justify-center">
              {ad.media && ad.media[selectedMediaIndex] ? (
                ad.media[selectedMediaIndex].type === 'image' ? (
                  <img src={ad.media[selectedMediaIndex].url} className="w-full h-full object-contain" />
                ) : (
                  <video src={ad.media[selectedMediaIndex].url} controls className="w-full h-full" />
                )
              ) : (
                <div className="text-white/50">Sin imagen</div>
              )}

              {/* Navigation Arrows */}
              {ad.media && ad.media.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedMediaIndex(i => (i - 1 + ad.media.length) % ad.media.length)}
                    className="absolute left-4 p-2 bg-black/50 text-white rounded-full"
                  >‹</button>
                  <button
                    onClick={() => setSelectedMediaIndex(i => (i + 1) % ad.media.length)}
                    className="absolute right-4 p-2 bg-black/50 text-white rounded-full"
                  >›</button>
                </>
              )}
            </div>

            <div className="p-8 overflow-y-auto">
              <h2 className="text-2xl font-black text-gray-800 mb-2">{ad.title}</h2>
              <p className="text-3xl font-black text-[#6e0ad6] mb-6">${ad.price.toLocaleString()}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Descripción</h4>
                  <p className="text-gray-600 leading-relaxed">{ad.description || 'Sin descripción'}</p>
                </div>
                {ad.details && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Detalles</h4>
                    <p className="text-gray-600 leading-relaxed">{ad.details}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatView;
