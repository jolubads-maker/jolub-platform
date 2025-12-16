import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

// Data from AdFilters (replicated for display purposes as requested)
const CATEGORIES_DATA = [
    { title: "Bienes raíces", count: 120 },
    { title: "Vehículos", count: 85 },
    { title: "Articulos Varios", count: 230 },
    { title: "Servicios profesionales", count: 45 }
];

const ChatPageLayout: React.FC = () => {
    const { chatLogs, currentUser } = useChatStore(state => ({
        chatLogs: state.chatLogs,
        currentUser: useAuthStore.getState().currentUser
    }));
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'categories' | 'chat' | 'list'>('chat'); // For mobile responsiveness

    // Mock active chats for Right Panel (using store data if available, else placeholder)
    const activeChats = Array.from(chatLogs.values());

    return (
        <div className="h-screen bg-[#0b141a] text-white flex overflow-hidden">

            {/* LEFT COLUMN (20%) - Categories */}
            <div className={`
                ${activeTab === 'categories' ? 'block' : 'hidden'} md:block
                w-full md:w-[20%] border-r border-white/10 bg-[#0b141a] flex flex-col
            `}>
                <div className="p-4 border-b border-white/10 bg-[#6e0ad6]">
                    <h2 className="font-bold text-lg">Categorías</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {CATEGORIES_DATA.map((cat, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                            <span className="font-medium text-gray-300 group-hover:text-white">{cat.title}</span>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-green-400 font-mono">
                                🟢 {cat.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER COLUMN (50%) - Chat Area */}
            <div className={`
                ${activeTab === 'chat' ? 'block' : 'hidden'} md:block
                w-full md:w-[50%] bg-[#0f1c24] flex flex-col relative
            `}>
                {/* Mobile Header navigation */}
                <div className="md:hidden flex bg-[#6e0ad6] p-2 justify-between">
                    <button onClick={() => setActiveTab('categories')} className={`p-2 ${activeTab === 'categories' ? 'bg-white/20' : ''}`}>Cats</button>
                    <button onClick={() => setActiveTab('chat')} className={`p-2 ${activeTab === 'chat' ? 'bg-white/20' : ''}`}>Chat</button>
                    <button onClick={() => setActiveTab('list')} className={`p-2 ${activeTab === 'list' ? 'bg-white/20' : ''}`}>Lista</button>
                </div>

                <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
                    <div>
                        <div className="w-20 h-20 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Selecciona una conversación</h3>
                        <p className="max-w-xs mx-auto">Elige un chat de la lista derecha para comenzar a mensajear.</p>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN (30%) - List & Details */}
            <div className={`
                ${activeTab === 'list' ? 'block' : 'hidden'} md:block
                w-full md:w-[30%] border-l border-white/10 bg-[#0b141a] flex flex-col
            `}>
                <div className="p-4 border-b border-white/10 bg-[#6e0ad6]">
                    <h2 className="font-bold text-lg">Chats Activos</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {activeChats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No tienes chats activos.
                        </div>
                    ) : (
                        activeChats.map((chat) => (
                            <div
                                key={chat.id}
                                className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors"
                                onClick={() => navigate(`/chat/${chat.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold">
                                        {chat.participantIds[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold truncate text-sm">Chat {chat.id.substring(0, 8)}...</h4>
                                            <span className="text-xs text-gray-500">
                                                {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">
                                            {chat.lastMessage?.text || 'Sin mensajes'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default ChatPageLayout;
