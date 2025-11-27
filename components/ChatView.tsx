import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog } from '../src/types';
import SendIcon from './icons/SendIcon';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/api.config';
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
  chatLog: ChatLog;
  onSendMessage: (message: string) => void;
  isOverlay?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ seller, buyer, onBack, chatLog, onSendMessage, isOverlay = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(chatLog.messages);
  const [isBlocked, setIsBlocked] = useState(chatLog.isBlocked || false);
  const [blockedBy, setBlockedBy] = useState<number | null>(chatLog.blockedBy || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { fetchMessages } = useChatStore();
  const [initialLoad, setInitialLoad] = useState(true);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Sincronizar mensajes si cambian las props (carga inicial) y buscar historial completo
  useEffect(() => {
    setMessages(chatLog.messages);
    setIsBlocked(chatLog.isBlocked || false);
    setBlockedBy(chatLog.blockedBy || null);

    // Buscar historial completo del servidor para este chat
    const loadHistory = async () => {
      if (chatLog.id) {
        console.log('🔄 Cargando historial completo para chat:', chatLog.id);
        await fetchMessages(chatLog.id);
      }
    };
    loadHistory();

    // Scroll inicial
    setTimeout(() => scrollToBottom(false), 100);
  }, [chatLog.id, fetchMessages]);

  // Update messages state when store updates
  useEffect(() => {
    if (chatLog.messages.length > messages.length) {
      setMessages(chatLog.messages);
    }
  }, [chatLog.messages]);

  useEffect(() => {
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
    });

    socketRef.current.on('receive_message', (newMessage: ChatMessage) => {
      console.log('📩 [CLIENT] Mensaje recibido del servidor:', newMessage);
      setMessages((prevMessages) => {
        if (prevMessages.some(m => m.id === newMessage.id)) return prevMessages;

        socketRef.current?.emit('mark_read', { chatId: chatLog.id, userId: buyer.id });
        return [...prevMessages, newMessage];
      });
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
  }, [chatLog.id, buyer.id]);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

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
  };

  return (
    // Full screen liquid background container (Page Background)
    <div className={`fixed inset-0 z-50 flex justify-end ${isOverlay ? 'bg-black/60 backdrop-blur-sm' : 'liquid-bg'}`}>

      {/* Chat Drawer - Right Aligned */}
      <div className="w-full md:w-[450px] h-full bg-[#0b141a]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center p-4 bg-black/20 backdrop-blur-md border-b border-white/10 justify-between">
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

          {/* Close Button (X) */}
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
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
    </div>
  );
};

export default ChatView;
