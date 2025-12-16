// ChatView con Firebase Firestore
// Chat en tiempo real usando Firestore listeners en lugar de Socket.io

import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog, Ad } from '../src/types';
import SendIcon from './icons/SendIcon';
import { useChatStore } from '../store/useChatStore';

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
  chatLog?: ChatLog;
  onSendMessage?: (message: string) => void;
  isOverlay?: boolean;
  ad?: Partial<Ad>;
  onClose?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  seller,
  buyer,
  onBack,
  chatLog: initialChatLog,
  onSendMessage,
  isOverlay = false,
  ad,
  onClose
}) => {
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState<string | undefined>(initialChatLog?.id);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatLog?.messages || []);
  const [isLoading, setIsLoading] = useState(!initialChatLog);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Firestore store hooks
  const ensureChatExists = useChatStore(state => state.ensureChatExists);
  const sendMessage = useChatStore(state => state.sendMessage);
  const subscribeToChat = useChatStore(state => state.subscribeToChat);
  const unsubscribeFromChat = useChatStore(state => state.unsubscribeFromChat);
  const chatLogs = useChatStore(state => state.chatLogs);
  const markAsRead = useChatStore(state => state.markAsRead);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Get buyer UID for Firebase
  const buyerUid = String(buyer.providerId || buyer.uid || buyer.id);
  const sellerUid = String(seller.providerId || seller.uid || seller.id);

  // Initialize or get chat
  useEffect(() => {
    const initChat = async () => {
      if (!chatId && seller && buyer) {
        try {
          setIsLoading(true);
          const newChatId = await ensureChatExists([buyerUid, sellerUid], ad?.id ? String(ad.id) : undefined);
          setChatId(newChatId);
        } catch (error) {
          console.error("Error initializing chat:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initChat();
  }, [seller, buyer, ad, chatId, ensureChatExists, buyerUid, sellerUid]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (chatId) {
      const unsubscribe = subscribeToChat(chatId);

      // Mark as read
      markAsRead(chatId, buyerUid);

      return () => {
        unsubscribeFromChat();
      };
    }
  }, [chatId, subscribeToChat, unsubscribeFromChat, markAsRead, buyerUid]);

  // Sync messages from store
  useEffect(() => {
    if (chatId) {
      const chatLog = chatLogs.get(chatId);
      if (chatLog && chatLog.messages) {
        setMessages(chatLog.messages);
      }
    }
  }, [chatId, chatLogs]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatId || isSending) return;

    setIsSending(true);
    const messageText = inputValue;
    setInputValue('');

    try {
      await sendMessage(chatId, buyerUid, messageText, 'buyer');

      if (onSendMessage) {
        onSendMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else onBack();
  };

  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-50 flex justify-end ${isOverlay ? 'bg-black/60 backdrop-blur-sm' : 'liquid-bg'}`}>
        <div className="w-full md:w-[450px] h-full bg-[#0b141a]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="text-white mt-4">Iniciando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${isOverlay ? 'bg-black/60 backdrop-blur-sm' : 'liquid-bg'}`}>
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
                <p className="text-xs text-white/60 flex items-center gap-1">
                  {seller.isOnline ? (
                    <span className="text-green-400">En línea</span>
                  ) : (
                    <span>Desconectado</span>
                  )}
                </p>
              </div>
            </div>

            <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Ad Context Header */}
          {ad && (
            <div className="px-4 pb-4 pt-0 flex items-center gap-3 bg-white/5 mx-4 mb-4 rounded-xl border border-white/10">
              {ad.media && ad.media.length > 0 && (
                <img src={ad.media[0].url} alt={ad.title} className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0 py-2">
                <h3 className="text-sm font-bold text-white truncate">{ad.title}</h3>
                <p className="text-xs text-[#d9520b] font-bold">${ad.price?.toLocaleString()} USD</p>
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
                const isCurrentUser = String(msg.userId) === buyerUid;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}
                  >
                    <div
                      className={`relative max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isCurrentUser
                        ? 'bg-[#4b0997] text-white rounded-tr-sm'
                        : 'bg-[#d9520b] text-white rounded-tl-sm'
                        }`}
                    >
                      <p className="break-words leading-relaxed">{msg.text}</p>
                      <div className={`flex justify-end items-center space-x-1 mt-1 opacity-70`}>
                        <span className="text-[10px] min-w-fit">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isCurrentUser && (
                          <span className={`text-[11px] ${msg.isRead ? 'text-blue-300' : 'text-white/60'}`}>
                            {msg.isRead ? (
                              // Double check - leído
                              <svg viewBox="0 0 16 15" width="16" height="15">
                                <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-7.655a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-7.655a.365.365 0 0 0-.063-.51z"></path>
                              </svg>
                            ) : (
                              // Single check - enviado pero no leído
                              <svg viewBox="0 0 12 11" width="12" height="11">
                                <path fill="currentColor" d="M11.155 2.12l-.485-.377a.37.37 0 0 0-.516.064L4.569 9.178a.326.326 0 0 1-.49.034L1.877 7.152a.37.37 0 0 0-.51.018l-.41.41a.37.37 0 0 0 .018.51l3.092 2.997a.326.326 0 0 0 .49-.034L11.22 2.636a.37.37 0 0 0-.065-.516z"></path>
                              </svg>
                            )}
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
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <div className={`flex-1 bg-white/5 rounded-full flex items-center px-4 py-2 border border-white/10 transition-colors ${isSending ? 'opacity-50 cursor-not-allowed' : 'focus-within:bg-white/10'}`}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isSending ? "Enviando..." : "Escribe un mensaje..."}
                disabled={isSending}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className={`p-3 rounded-full transition-all transform flex items-center justify-center ${inputValue.trim() && !isSending
                ? 'bg-[#4b0997] hover:bg-[#5b06b6] hover:scale-105 text-white shadow-lg shadow-purple-900/50'
                : 'bg-white/10 text-white/30 cursor-default'
                }`}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <SendIcon className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
