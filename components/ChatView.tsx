import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog } from '../src/types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SendIcon from './icons/SendIcon';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/api.config';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sincronizar mensajes si cambian las props (carga inicial)
  useEffect(() => {
    setMessages(chatLog.messages);
    scrollToBottom();
  }, [chatLog.messages]);

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
    });

    socketRef.current.on('receive_message', (newMessage: ChatMessage) => {
      console.log('📩 [CLIENT] Mensaje recibido del servidor:', newMessage);
      setMessages((prevMessages) => {
        // Evitar duplicados si el mensaje ya existe
        if (prevMessages.some(m => m.id === newMessage.id)) {
          console.log('⚠️ Mensaje duplicado ignorado:', newMessage.id);
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
      scrollToBottom();
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ [CLIENT] Error de conexión socket:', err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatLog.id]);

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
          console.error('❌ [CLIENT] Error reportado por el servidor:', response.error);
        } else {
          console.log('✅ [CLIENT] Mensaje confirmado por el servidor');
        }
      });
    } else {
      console.error('⚠️ Socket no inicializado');
    }

    setInputValue('');
  };

  return (
    // Fondo estilo WhatsApp (oscuro con patrón sutil si fuera posible, aquí usaremos un color sólido oscuro elegante)
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden animate-fade-in bg-[#0b141a]">

      {/* Header WhatsApp Style */}
      <div className="flex items-center p-3 bg-[#202c33] border-b border-[#2f3b43]">
        <button onClick={onBack} className="text-[#aebac1] hover:text-white mr-3 transition-colors">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="relative cursor-pointer">
          <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
          {seller.isOnline && (
            <div className="absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-[#202c33] bg-[#00a884]"></div>
          )}
        </div>
        <div className="flex-1 cursor-pointer">
          <h2 className="text-base font-medium text-[#e9edef] leading-tight">{seller.name}</h2>
          <p className="text-xs text-[#8696a0]">
            {seller.isOnline ? 'En línea' : 'Ult. vez hoy a las...'}
          </p>
        </div>
      </div>

      {/* Chat Area WhatsApp Style */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#0b141a] bg-opacity-95" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}>
        <div className="flex flex-col space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-[#202c33] rounded-xl p-4 inline-block mb-4 shadow-sm">
                <p className="text-[#e9edef] text-sm">
                  🔒 Los mensajes están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera WhatsApp, puede leerlos ni escucharlos.
                </p>
              </div>
              <p className="text-[#8696a0] text-sm mt-4">Envía un mensaje para comenzar la conversación.</p>
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
                    className={`relative max-w-[80%] px-3 py-1.5 rounded-lg shadow-sm text-sm ${isCurrentUser
                      ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' // Usuario: Verde WhatsApp
                      : 'bg-[#202c33] text-[#e9edef] rounded-tl-none' // Otro: Gris oscuro
                      }`}
                  >
                    <p className="break-words leading-relaxed">{msg.text}</p>
                    <div className={`flex justify-end items-center space-x-1 mt-1 ${isCurrentUser ? 'text-[#8696a0]' : 'text-[#8696a0]'}`}>
                      <span className="text-[10px] min-w-fit">
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[#53bdeb]">
                          {/* Doble check azul simulado */}
                          <svg viewBox="0 0 16 15" width="16" height="15" className="">
                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-7.655a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-7.655a.365.365 0 0 0-.063-.51z"></path>
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Triángulo de la burbuja */}
                    {isCurrentUser ? (
                      <span className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#005c4b] border-r-[10px] border-r-transparent transform rotate-0"></span>
                    ) : (
                      <span className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-[#202c33] border-l-[10px] border-l-transparent transform rotate-0 scale-x-[-1]"></span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area WhatsApp Style */}
      <div className="p-2 bg-[#202c33] flex items-center space-x-2">
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-2">
          <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center px-4 py-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje"
              className="flex-1 bg-transparent text-[#d1d7db] placeholder-[#8696a0] outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={`p-3 rounded-full transition-colors flex items-center justify-center ${inputValue.trim()
              ? 'bg-[#00a884] hover:bg-[#008f70] text-white'
              : 'bg-[#2a3942] text-[#8696a0] cursor-default'
              }`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
