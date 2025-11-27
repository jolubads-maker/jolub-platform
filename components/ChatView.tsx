import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog } from '../src/types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SendIcon from './icons/SendIcon';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/api.config';
import { useChatStore } from '../store/useChatStore';

interface ChatViewProps {
  seller: User;
  buyer: User;
  onBack: () => void;
  chatLog: ChatLog;
  onSendMessage: (message: string) => void; // Mantener por compatibilidad si es necesario
}

const ChatView: React.FC<ChatViewProps> = ({ seller, buyer, onBack, chatLog, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(chatLog.messages);
  const [isBlocked, setIsBlocked] = useState(chatLog.isBlocked || false);
  const [blockedBy, setBlockedBy] = useState<number | null>(chatLog.blockedBy || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { fetchMessages } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    scrollToBottom();
  }, [chatLog.messages, chatLog.id, fetchMessages, chatLog.isBlocked, chatLog.blockedBy]);

  useEffect(() => {
    // Inicializar conexión de Socket.io usando la URL correcta (Render en prod)
    const socketUrl = getSocketUrl();

    console.log('🔌 Conectando socket a:', socketUrl);

    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      auth: {
        token: buyer.sessionToken // Enviar token de sesión para autenticación
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado:', socketRef.current?.id);
      // Unirse a la sala del chat
      socketRef.current?.emit('join_chat', chatLog.id);

      // Marcar como leídos al entrar
      socketRef.current?.emit('mark_read', { chatId: chatLog.id, userId: buyer.id });
    });

    socketRef.current.on('receive_message', (newMessage: ChatMessage) => {
      console.log('📩 [CLIENT] Mensaje recibido del servidor:', newMessage);
      setMessages((prevMessages) => {
        // Evitar duplicados si el mensaje ya existe
        if (prevMessages.some(m => m.id === newMessage.id)) {
          console.log('⚠️ Mensaje duplicado ignorado:', newMessage.id);
          return prevMessages;
        }
        // Si estoy viendo el chat, marcar como leído inmediatamente
        socketRef.current?.emit('mark_read', { chatId: chatLog.id, userId: buyer.id });
        return [...prevMessages, newMessage];
      });
      scrollToBottom();
    });

    socketRef.current.on('messages_read', (data: { chatId: string, readerId: number }) => {
      if (data.chatId === chatLog.id && data.readerId !== buyer.id) {
        // El otro usuario leyó mis mensajes
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

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ [CLIENT] Error de conexión socket:', err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatLog.id, buyer.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMessageUser = (message: ChatMessage) => {
    return message.userId === seller.id ? seller : buyer;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Emitir evento de mensaje al servidor
    if (socketRef.current) {
      const messageData = {
        chatId: chatLog.id,
        userId: buyer.id,
        text: inputValue,
        sender: 'buyer' // O lógica para determinar sender
      };

      console.log('📤 [CLIENT] Enviando mensaje:', messageData);
      socketRef.current.emit('send_message', messageData, (response: any) => {
        console.log('📥 [CLIENT] Respuesta del servidor:', response);
        if (response.status !== 'ok') {
          if (response.error === 'Chat is blocked') {
            setIsBlocked(true);
            alert('No puedes enviar mensajes porque el chat está bloqueado.');
          }
          console.error('❌ [CLIENT] Error reportado por el servidor:', response.error);
        } else {
          console.log('✅ [CLIENT] Mensaje confirmado por el servidor');
        }
      });
    }

    setInputValue('');
  };

  return (
    // Full screen liquid background container
    <div className="fixed inset-0 z-50 liquid-bg flex items-center justify-center p-4 md:p-6">

      {/* Chat Card - Glassmorphism (More Opaque) */}
      <div className="flex flex-col w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-fade-in bg-[#0b141a]/90 backdrop-blur-xl border border-white/10 relative">

        {/* Header - Transparent */}
        <div className="flex items-center p-3 bg-black/20 backdrop-blur-md border-b border-white/10">
          <button onClick={onBack} className="text-white/80 hover:text-white mr-3 transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="relative cursor-pointer">
            <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-white/20" />
            {seller.isOnline && (
              <div className="absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-[#5b06b6] bg-green-400"></div>
            )}
          </div>
          <div className="flex-1 cursor-pointer">
            <h2 className="text-base font-medium text-white leading-tight">{seller.name}</h2>
            <p className="text-xs text-white/70">
              {seller.isOnline ? 'En línea' : 'Ult. vez hoy a las...'}
            </p>
          </div>
        </div>

        {/* Chat Area - Transparent */}
        <div className="flex-1 p-4 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="flex flex-col space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 inline-block mb-4 shadow-sm border border-white/10">
                  <p className="text-white/80 text-sm">
                    🔒 Los mensajes están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera WhatsApp, puede leerlos ni escucharlos.
                  </p>
                </div>
                <p className="text-white/60 text-sm mt-4">Envía un mensaje para comenzar la conversación.</p>
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
                      className={`relative max-w-[80%] px-3 py-1.5 rounded-lg shadow-sm text-sm border border-white/5 ${isCurrentUser
                        ? 'bg-[#5b06b6]/80 backdrop-blur-sm text-white rounded-tr-none' // Usuario: Purple Glass
                        : 'bg-black/40 backdrop-blur-sm text-white rounded-tl-none' // Otro: Dark Glass
                        }`}
                    >
                      <p className="break-words leading-relaxed">{msg.text}</p>
                      <div className={`flex justify-end items-center space-x-1 mt-1 ${isCurrentUser ? 'text-white/70' : 'text-white/60'}`}>
                        <span className="text-[10px] min-w-fit">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isCurrentUser && (
                          <span className={`text-[11px] ${msg.isRead ? 'text-blue-300' : 'text-white/60'}`}>
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

        {/* Input Area Glass Style */}
        <div className="p-2 bg-black/20 backdrop-blur-md border-t border-white/10 flex items-center space-x-2">
          {isBlocked ? (
            <div className="w-full p-4 bg-black/40 text-center rounded-lg border border-red-500/30">
              <p className="text-red-400 font-bold text-sm">
                {blockedBy === buyer.id
                  ? 'Has bloqueado a este usuario.'
                  : 'Has sido bloqueado por el usuario.'}
              </p>
              <p className="text-white/60 text-xs mt-1">
                Su mensaje con ese usuario se eliminará en 24hrs.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-2">
              <div className="flex-1 bg-white/10 rounded-lg flex items-center px-4 py-2 border border-white/5 focus-within:bg-white/20 transition-colors">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje"
                  className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`p-3 rounded-full transition-colors flex items-center justify-center ${inputValue.trim()
                  ? 'bg-[#5b06b6] hover:bg-[#7c3aed] text-white shadow-lg'
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
