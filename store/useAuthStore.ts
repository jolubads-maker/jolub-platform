import { create } from 'zustand';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthState {
    currentUser: User | null;
    users: User[];
    loading: boolean;
    error: string | null;

    // Actions
    setError: (error: string | null) => void;
    setCurrentUser: (user: User | null) => void;
    setUsers: (users: User[]) => void;
    fetchUsers: () => Promise<void>;
    login: (userInfo: any) => Promise<User | void>;
    logout: () => Promise<void>;
    verifySession: () => Promise<void>;
    updateUserStatus: (userId: number, isOnline: boolean) => Promise<void>;
    updateUserPhone: (phoneNumber: string) => Promise<void>;
    updateUserEmail: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null,

    setError: (error) => set({ error }),
    setCurrentUser: (user) => set({ currentUser: user }),
    setUsers: (users) => set({ users }),

    fetchUsers: async () => {
        try {
            const users = await apiService.getUsers();
            set({ users });
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    },

    login: async (userInfo) => {
        try {
            set({ loading: true, error: null });
            const user = await apiService.createOrUpdateUser(userInfo);
            const sessionToken = await apiService.generateSessionToken(user.id);

            // Update online status
            const updatedUser = await apiService.updateUserOnlineStatus(user.id, true);

            set(state => {
                const existingUserIndex = state.users.findIndex(u => u.id === updatedUser.id);
                let newUsers = [...state.users];
                if (existingUserIndex >= 0) {
                    newUsers[existingUserIndex] = updatedUser;
                } else {
                    newUsers.push(updatedUser);
                }
                return { currentUser: updatedUser, users: newUsers, loading: false };
            });

            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            localStorage.setItem('sessionToken', sessionToken);

            return updatedUser;
        } catch (error: any) {
            set({ error: error.message || 'Error logging in', loading: false });
            throw error;
        }
    },

    logout: async () => {
        const { currentUser } = get();
        if (currentUser) {
            try {
                await apiService.updateUserOnlineStatus(currentUser.id, false);
            } catch (error) {
                console.error('Error setting offline status:', error);
            }
        }

        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('phoneVerification');

        set({ currentUser: null });
    },

    verifySession: async () => {
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) {
            try {
                const user = await apiService.authenticateWithToken(sessionToken);
                if (user) {
                    set({ currentUser: user });
                    // Also refresh users list to ensure we have latest data
                    get().fetchUsers();
                }
            } catch (error) {
                console.error('Session verification failed:', error);
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('currentUser');
                set({ currentUser: null });
            }
        } else {
            // Fallback to legacy local storage if needed, or just clear
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    // We should verify this against API but for now just load it if no token
                    // Ideally we rely on token.
                    // Let's try to find in users list if already fetched
                    // But we can't trust local storage fully without token.
                    // For now, let's assume token is the way.
                } catch (e) {
                    localStorage.removeItem('currentUser');
                }
            }
        }
    },

    updateUserStatus: async (userId, isOnline) => {
        try {
            await apiService.updateUserOnlineStatus(userId, isOnline);
            // Optimistic update or refetch
            set(state => ({
                users: state.users.map(u => u.id === userId ? { ...u, isOnline } : u)
            }));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    },

    updateUserPhone: async (phoneNumber) => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
            const updatedUser = await apiService.verifyUserPhone(currentUser.id, phoneNumber);
            set(state => ({
                currentUser: updatedUser,
                users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
            }));
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } catch (error) {
            throw error;
        }
    },

    updateUserEmail: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        // 1. Optimistic Update: Update local state immediately
        const optimisticUser = { ...currentUser, emailVerified: true };
        set(state => ({
            currentUser: optimisticUser,
            users: state.users.map(u => u.id === optimisticUser.id ? optimisticUser : u)
        }));
        localStorage.setItem('currentUser', JSON.stringify(optimisticUser));

        try {
            // 2. Background Re-fetch to ensure consistency
            const sessionToken = localStorage.getItem('sessionToken');
            if (sessionToken) {
                const updatedUser = await apiService.authenticateWithToken(sessionToken);
                if (updatedUser) {
                    set(state => ({
                        currentUser: updatedUser,
                        users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
                    }));
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                }
            }
        } catch (error) {
            console.error('Error syncing user status after email verification:', error);
            // We don't revert here because the verification *did* succeed (this function is called on success)
        }
    }
}));
