import React from 'react';
import { motion } from 'framer-motion';
import { ChatLog, User } from '../../src/types';
import StarIcon from '../icons/StarIcon';

interface DashboardChatsProps {
    userChats: ChatLog[];
    currentUser: User;
    users: User[];
    onSelectChat: (chatId: string) => void;
    onBlockUser: (user: User) => void;
    onVerifyEmail: () => void;
}

const DashboardChats: React.FC<DashboardChatsProps> = ({
    userChats,
    currentUser,
    users,
    onSelectChat,
    onBlockUser,
    onVerifyEmail
}) => {

    const getOtherParticipant = (chat: ChatLog) => {
        const otherId = chat.participantIds.find(id => id !== currentUser.id);
        return users.find(user => user.id === otherId);
    };

    return (
        <div className="col-span-1 md:col-span-4 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[400px]">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-3 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                Mensajes Recientes
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {userChats.length > 0 ? (
                    userChats.map((chat, index) => {
                        const otherUser = getOtherParticipant(chat);
                        if (!otherUser) return null;
                        const hasUnread = chat.messages && chat.messages.some((m: any) => !m.isRead && m.userId !== currentUser.id);

                        return (
                            <motion.div
                                key={chat.id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 rounded-2xl border-2 border-black bg-white hover:shadow-lg transition-all relative group gap-4"
                            >
                                {/* Unread Badge */}
                                {hasUnread && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm z-20"></div>
                                )}

                                {/* LEFT SIDE: Profile -> Name -> Reputation -> Divider -> Ad Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">

                                    {/* 1. Profile Image */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={otherUser.avatar || 'https://via.placeholder.com/40'}
                                            alt={otherUser.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                                        />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    </div>

                                    {/* 2. Username */}
                                    <h4 className="font-bold text-gray-800 text-sm truncate max-w-[120px]">
                                        {otherUser.name}
                                    </h4>

                                    {/* 3. Reputation Box */}
                                    <div className="flex items-center gap-1 bg-[#ea580c] px-2 py-1 rounded-md shadow-sm">
                                        <StarIcon className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">{otherUser.points || 0}</span>
                                        <span className="text-[10px] text-white font-medium">Reputación</span>
                                    </div>

                                    {/* 4. Divider Line */}
                                    <div className="h-8 w-[1px] bg-black mx-2"></div>

                                    {/* 5, 6, 7. Ad Info */}
                                    {chat.ad ? (
                                        <div className="flex items-center gap-3">
                                            {/* Thumbnail */}
                                            {chat.ad.media && chat.ad.media[0] ? (
                                                <img src={chat.ad.media[0].url} alt="Ad" className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                    <span className="text-[8px] text-gray-400">N/A</span>
                                                </div>
                                            )}

                                            {/* ID & Price */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-black">
                                                    #{chat.ad.uniqueCode || chat.ad.id}
                                                </span>
                                                <span className="text-sm font-bold text-[#6e0ad6]">
                                                    ${chat.ad.price}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Anuncio no disponible</span>
                                    )}
                                </div>

                                {/* RIGHT SIDE: Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectChat(chat.id);
                                        }}
                                        className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                    >
                                        Chat
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onBlockUser(otherUser);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                    >
                                        Bloquear
                                    </button>
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-4 py-2 bg-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors shadow-sm cursor-not-allowed"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
                        {!currentUser.emailVerified ? (
                            <motion.div
                                onClick={onVerifyEmail}
                                className="w-full cursor-pointer flex flex-col items-center gap-4 transition-all group py-10"
                            >
                                <div className="transition-transform duration-300 group-hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#ea580c]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <span className="text-xl font-bold text-black block mb-1">Verifica tu Correo</span>
                                    <span className="text-sm text-black font-medium">Necesario para chatear</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 group">
                                <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#ea580c]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <p className="font-bold text-lg text-black">No hay conversaciones</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardChats;
