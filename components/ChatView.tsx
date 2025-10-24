import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatLog } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SendIcon from './icons/SendIcon';

interface ChatViewProps {
  seller: User;
  buyer: User;
  onBack: () => void;
  chatLog: ChatLog;
  onSendMessage: (message: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ seller, buyer, onBack, chatLog, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog.messages]);

  const getMessageUser = (message: ChatMessage) => {
    return message.userId === seller.id ? seller : buyer;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    onSendMessage(inputValue);
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
          <div className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-gray-800 ${
            seller.isOnline ? 'bg-green-500' : 'bg-gray-500'
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
          {chatLog.messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Inicia la conversación con {seller.name}</p>
            </div>
          ) : (
            chatLog.messages.map((msg) => {
              const messageUser = getMessageUser(msg);
              const isCurrentUser = msg.userId === buyer.id;
              
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && <img src={messageUser.avatar} alt={messageUser.name} className="w-8 h-8 rounded-full" />}
                  <div className="flex flex-col">
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                        isCurrentUser
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
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-full py-2 px-4 focus:ring-brand-secondary focus:border-brand-secondary"
            disabled={!seller.isOnline}
          />
          <button
            type="submit"
            disabled={!seller.isOnline || !inputValue.trim()}
            className="bg-brand-primary text-white rounded-full p-3 hover:bg-brand-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
        {!seller.isOnline && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            El vendedor no está en línea. Los mensajes se enviarán cuando esté disponible.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatView;