// Chat Store con Firebase Firestore
// Chat en tiempo real usando Firestore listeners

import { create } from 'zustand';
import { ChatLog, ChatMessage } from '../src/types';
import { chatService } from '../services/firebaseService';

interface ChatState {
    chatLogs: Map<string, ChatLog>;
    activeSubscription: (() => void) | null;
    userChatsSubscription: (() => void) | null;
    loading: boolean;
    error: string | null;

    // Actions
    loadUserChats: (userId: string) => Promise<void>;
    subscribeToUserChats: (userId: string) => () => void;
    fetchMessages: (chatId: string) => Promise<void>;
    sendMessage: (chatId: string, userId: string, text: string, sender: 'buyer' | 'seller') => Promise<void>;
    addMessage: (chatId: string, message: ChatMessage) => void;
    ensureChatExists: (participantIds: string[], adId?: string) => Promise<string>;
    markAsRead: (chatId: string, userId: string) => void;
    subscribeToChat: (chatId: string) => () => void;
    unsubscribeFromChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    chatLogs: new Map(),
    activeSubscription: null,
    userChatsSubscription: null,
    loading: false,
    error: null,

    loadUserChats: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const userChats = await chatService.getUserChats(userId);

            const newLogs = new Map<string, ChatLog>();
            userChats.forEach(chat => {
                newLogs.set(chat.id, chat);
            });

            set({ chatLogs: newLogs, loading: false });
        } catch (error: any) {
            console.error('Error loading chats:', error);
            set({ error: error.message, loading: false });
        }
    },

    // Suscribirse a chats del usuario en tiempo real
    subscribeToUserChats: (userId: string) => {
        // Cancelar suscripción anterior si existe
        const { userChatsSubscription } = get();
        if (userChatsSubscription) {
            userChatsSubscription();
        }

        const unsubscribe = chatService.subscribeToUserChats(userId, (chats) => {
            const newLogs = new Map<string, ChatLog>();
            chats.forEach(chat => {
                newLogs.set(chat.id, chat);
            });
            set({ chatLogs: newLogs, loading: false });
        });

        set({ userChatsSubscription: unsubscribe });
        return unsubscribe;
    },

    fetchMessages: async (chatId: string) => {
        try {
            const messages = await chatService.getMessages(chatId);

            set(state => {
                const newLogs = new Map(state.chatLogs);
                const currentLog = newLogs.get(chatId);

                if (currentLog) {
                    newLogs.set(chatId, {
                        ...currentLog,
                        messages,
                        lastMessage: messages[messages.length - 1]
                    });
                }

                return { chatLogs: newLogs };
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    },

    sendMessage: async (chatId: string, userId: string, text: string, sender: 'buyer' | 'seller') => {
        try {
            const newMessage = await chatService.sendMessage(chatId, userId, text, sender);
            get().addMessage(chatId, newMessage);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    addMessage: (chatId: string, message: ChatMessage) => {
        set(state => {
            const newLogs = new Map(state.chatLogs);
            const currentLog = newLogs.get(chatId);

            if (currentLog) {
                // Evitar duplicados
                const messageExists = currentLog.messages.some(m => m.id === message.id);
                if (!messageExists) {
                    newLogs.set(chatId, {
                        ...currentLog,
                        messages: [...currentLog.messages, message],
                        lastMessage: message
                    });
                }
            } else {
                // Crear nuevo log si no existe
                newLogs.set(chatId, {
                    id: chatId,
                    participantIds: [],
                    messages: [message],
                    lastMessage: message,
                    updatedAt: new Date()
                });
            }

            return { chatLogs: newLogs };
        });
    },

    ensureChatExists: async (participantIds: string[], adId?: string) => {
        try {
            const chatId = await chatService.getOrCreateChat(participantIds, adId);

            set(state => {
                if (!state.chatLogs.has(chatId)) {
                    const newLogs = new Map(state.chatLogs);
                    newLogs.set(chatId, {
                        id: chatId,
                        participantIds: participantIds.map(id => parseInt(id) || 0),
                        messages: [],
                        lastMessage: undefined,
                        updatedAt: new Date()
                    });
                    return { chatLogs: newLogs };
                }
                return {};
            });

            return chatId;
        } catch (error) {
            console.error('Error ensuring chat exists:', error);
            throw error;
        }
    },

    markAsRead: async (chatId: string, userId: string) => {
        try {
            await chatService.markAsRead(chatId, userId);

            set(state => {
                const newLogs = new Map(state.chatLogs);
                const currentLog = newLogs.get(chatId);

                if (currentLog) {
                    const updatedMessages = currentLog.messages.map(msg => ({
                        ...msg,
                        isRead: true
                    }));

                    newLogs.set(chatId, {
                        ...currentLog,
                        messages: updatedMessages,
                        lastMessage: currentLog.lastMessage
                            ? { ...currentLog.lastMessage, isRead: true }
                            : undefined
                    });

                    return { chatLogs: newLogs };
                }
                return {};
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },

    // Suscribirse a mensajes en tiempo real
    subscribeToChat: (chatId: string) => {
        // Cancelar suscripción anterior si existe
        const { activeSubscription } = get();
        if (activeSubscription) {
            activeSubscription();
        }

        const unsubscribe = chatService.subscribeToMessages(chatId, (messages) => {
            set(state => {
                const newLogs = new Map(state.chatLogs);
                const currentLog = newLogs.get(chatId);

                newLogs.set(chatId, {
                    id: chatId,
                    participantIds: currentLog?.participantIds || [],
                    messages,
                    lastMessage: messages[messages.length - 1],
                    updatedAt: new Date()
                });

                return { chatLogs: newLogs };
            });
        });

        set({ activeSubscription: unsubscribe });
        return unsubscribe;
    },

    unsubscribeFromChat: () => {
        const { activeSubscription } = get();
        if (activeSubscription) {
            activeSubscription();
            set({ activeSubscription: null });
        }
    }
}));
