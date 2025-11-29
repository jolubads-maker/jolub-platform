import { create } from 'zustand';
import { ChatLog, ChatMessage } from '../src/types';
import { apiService } from '../services/apiService';

interface ChatState {
    chatLogs: Map<string, ChatLog>;
    loading: boolean;
    error: string | null;

    // Actions
    loadUserChats: (userId: number) => Promise<void>;
    fetchMessages: (chatId: string) => Promise<void>;
    sendMessage: (chatId: string, userId: number, text: string, sender: 'user' | 'seller' | 'buyer') => Promise<void>;
    addMessage: (chatId: string, message: ChatMessage) => void;
    ensureChatExists: (chatId: string, participantIds: number[]) => void;
    markAsRead: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    chatLogs: new Map(),
    loading: false,
    error: null,

    loadUserChats: async (userId) => {
        try {
            const userChats = await apiService.getUserChats(userId);

            set(state => {
                const newLogs = new Map(state.chatLogs); // Start with existing logs to preserve history

                userChats.forEach((chatParticipant: any) => {
                    const chat = chatParticipant.chat;
                    const existingLog = newLogs.get(chat.id);

                    const newMessages = chat.messages.map((msg: any) => ({
                        id: msg.id,
                        text: msg.text,
                        sender: msg.sender as 'user' | 'seller' | 'buyer',
                        userId: msg.userId,
                        timestamp: new Date(msg.timestamp || new Date())
                    }));

                    // CRITICAL FIX: Preserve existing messages if we have more than the summary
                    // This prevents the dashboard update from wiping out the full chat history
                    let mergedMessages = newMessages;

                    // DEBUG LOGS
                    if (existingLog) {
                        console.log(`[STORE] Merging chat ${chat.id}. Existing: ${existingLog.messages.length}, New: ${newMessages.length}`);
                    }

                    if (existingLog && existingLog.messages.length > newMessages.length) {
                        mergedMessages = existingLog.messages;

                        // Optional: Ensure the latest message from summary is in our history
                        // (Socket usually handles this, but good for consistency)
                        const lastNewMsg = newMessages[newMessages.length - 1];
                        if (lastNewMsg && !mergedMessages.some(m => m.id === lastNewMsg.id)) {
                            console.log(`[STORE] Appending new message to history: ${lastNewMsg.text}`);
                            mergedMessages = [...mergedMessages, lastNewMsg];
                        }
                    } else {
                        if (existingLog) console.log(`[STORE] Overwriting history with new messages (Existing was smaller or equal)`);
                    }

                    newLogs.set(chat.id, {
                        id: chat.id,
                        participantIds: chat.participants.map((p: any) => p.userId),
                        messages: mergedMessages,
                        lastMessage: chat.messages[0] ? {
                            id: chat.messages[0].id,
                            text: chat.messages[0].text,
                            sender: chat.messages[0].sender as 'user' | 'seller' | 'buyer',
                            userId: chat.messages[0].userId,
                            timestamp: new Date(chat.messages[0].timestamp || new Date())
                        } : undefined,
                        ad: chat.ad ? {
                            id: chat.ad.id,
                            uniqueCode: chat.ad.uniqueCode,
                            title: chat.ad.title,
                            price: chat.ad.price,
                            media: chat.ad.media
                        } : undefined
                    });
                });

                return { chatLogs: newLogs };
            });
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    },

    fetchMessages: async (chatId) => {
        try {
            const messages = await apiService.getChatMessages(chatId);
            set(state => {
                const newLogs = new Map(state.chatLogs);
                const currentLog = newLogs.get(chatId);

                if (currentLog) {
                    newLogs.set(chatId, {
                        ...currentLog,
                        messages: messages.map((msg: any) => ({
                            id: msg.id,
                            text: msg.text,
                            sender: msg.sender as 'user' | 'seller' | 'buyer',
                            userId: msg.userId,
                            timestamp: new Date(msg.createdAt || msg.timestamp || new Date())
                        }))
                    });
                }
                return { chatLogs: newLogs };
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
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
                    id: chatId,
                    participantIds,
                    messages: [],
                    lastMessage: undefined
                });
                return { chatLogs: newLogs };
            }
            return {};
        });
    },

    markAsRead: (chatId) => {
        set(state => {
            const newLogs = new Map(state.chatLogs);
            const currentLog = newLogs.get(chatId);
            if (currentLog) {
                // Mark all messages as read (or at least the ones from the other user)
                // For simplicity in UI, we assume if we mark as read, the "pending" status is cleared.
                // In reality, we might want to check userId, but for the "Pending" badge, 
                // usually it checks if the last message is from other and !isRead.
                const updatedMessages = currentLog.messages.map(msg => ({ ...msg, isRead: true }));
                // Also update lastMessage if it exists
                const updatedLastMessage = currentLog.lastMessage ? { ...currentLog.lastMessage, isRead: true } : undefined;

                newLogs.set(chatId, {
                    ...currentLog,
                    messages: updatedMessages,
                    lastMessage: updatedLastMessage
                });
                return { chatLogs: newLogs };
            }
            return {};
        });
    }
}));
