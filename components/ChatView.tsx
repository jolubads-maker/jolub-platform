import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SendIcon from './icons/SendIcon';
import { io, Socket } from 'socket.io-client';

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
  }, [chatLog.messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Configuración de Socket.io
  useEffect(() => {
    // Conectar al servidor
    socketRef.current = io('http://localhost:4000');

    // Unirse a la sala del chat
    socketRef.current.emit('join_chat', chatLog.id);

    // Escuchar nuevos mensajes
    socketRef.current.on('receive_message', (newMessage: ChatMessage) => {
      setMessages((prevMessages) => {
        // Evitar duplicados si el mensaje ya existe (por si acaso)
        if (prevMessages.some(m => m.id === newMessage.id)) return prevMessages;
        return [...prevMessages, newMessage];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chatLog.id]);

  const getMessageUser = (message: ChatMessage) => {
    return message.userId === seller.id ? seller : buyer;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Emitir evento de mensaje al servidor
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        chatId: chatLog.id,
        userId: buyer.id,
        text: inputValue,
        sender: 'buyer' // O lógica para determinar sender
      });
    }

    // Opcional: llamar al prop si el padre necesita saber (aunque el socket actualiza la vista)
    // onSendMessage(inputValue); 

    setInputValue('');
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-xl animate-fade-in">
      <div className="flex items-center p-4 border-b border-gray-700">
        <button onClick={onBack} className="text-brand-secondary hover:text-brand-light mr-4">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="relative">
          <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full mr-3" />
          <div className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-gray-800 ${seller.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
        </div>
        <div>
          <h2 className="text-lg font-bold">{seller.name}</h2>
          <p className={`text-xs ${seller.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
            {seller.isOnline ? 'En línea' : 'Desconectado'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Inicia la conversación con {seller.name}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const messageUser = getMessageUser(msg);
              const isCurrentUser = msg.userId === buyer.id;

              return (
                <div
                  key={msg.id || Math.random()} // Fallback key si id es temporal
                  className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && <img src={messageUser.avatar} alt={messageUser.name} className="w-8 h-8 rounded-full" />}
                  <div className="flex flex-col">
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${isCurrentUser
                          ? 'bg-brand-primary text-white rounded-br-none'
                          : 'bg-gray-700 text-gray-200 rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {isCurrentUser && <img src={messageUser.avatar} alt={messageUser.name} className="w-8 h-8 rounded-full" />}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={seller.isOnline ? "Escribe tu mensaje..." : "El vendedor no está en línea..."}
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-full py-2 px-4 focus:ring-brand-secondary focus:border-brand-secondary disabled:opacity-50"
          // disabled={!seller.isOnline} // Permitir dejar mensajes aunque esté offline
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-brand-primary text-white rounded-full p-3 hover:bg-brand-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            title="Enviar mensaje"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;