import { create } from 'zustand';
import { ChatLog, ChatMessage } from '../src/types';
import { apiService } from '../services/apiService';

interface ChatState {
    chatLogs: Map<string, ChatLog>;
    loading: boolean;
    error: string | null;

    // Actions
    loadUserChats: (userId: number) => Promise<void>;
    sendMessage: (chatId: string, userId: number, text: string, sender: 'user' | 'seller' | 'buyer') => Promise<void>;
    addMessage: (chatId: string, message: ChatMessage) => void;
    ensureChatExists: (chatId: string, participantIds: number[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    chatLogs: new Map(),
    loading: false,
    error: null,

    loadUserChats: async (userId) => {
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

            set({ chatLogs: chatMap });
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    },

    sendMessage: async (chatId, userId, text, sender) => {
        try {
            const newMessage = await apiService.sendMessage(chatId, userId, text, sender);
            get().addMessage(chatId, newMessage);
        } catch (error) {
            throw error;
        }
    },

    addMessage: (chatId, message) => {
        set(state => {
            const newLogs = new Map(state.chatLogs);
            const currentLog = newLogs.get(chatId);

            if (currentLog) {
                newLogs.set(chatId, {
                    ...currentLog,
                    messages: [...currentLog.messages, message],
                    lastMessage: message
                });
            } else {
                // If chat log doesn't exist locally yet, we might need to fetch it or create partial
                // For now, we assume ensureChatExists was called or we just ignore if not found
                // But better to create it if we have context.
            }
            return { chatLogs: newLogs };
        });
    },

    ensureChatExists: (chatId, participantIds) => {
        set(state => {
            if (!state.chatLogs.has(chatId)) {
                const newLogs = new Map(state.chatLogs);
                newLogs.set(chatId, {
                    participantIds,
                    messages: [],
                    lastMessage: undefined
                });
                return { chatLogs: newLogs };
            }
            return {};
        });
    }
}));
