import { create } from 'zustand';
import { User } from '../src/types';
import { apiService } from '../services/apiService';

interface AuthState {
    currentUser: User | null;
    users: User[];
    loading: boolean;
    error: string | null;
    isCheckingSession: boolean;

    // Actions
    setError: (error: string | null) => void;
    setCurrentUser: (user: User | null) => void;
    setUsers: (users: User[]) => void;
    fetchUsers: () => Promise<void>;
    getUserById: (userId: number) => Promise<User | undefined>;
    login: (userInfo: any) => Promise<User | void>;
    logout: () => Promise<void>;
    verifySession: () => Promise<void>;
    updateUserStatus: (userId: number, isOnline: boolean) => Promise<void>;
    updateUserPhone: (phoneNumber: string) => Promise<void>;
    updateUserEmail: () => Promise<void>;
    togglePrivacy: (field: 'showEmail' | 'showPhone') => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null,
    isCheckingSession: true,

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

    getUserById: async (userId: number) => {
        const { users } = get();
        const existingUser = users.find(u => u.id === userId);
        if (existingUser) return existingUser;

        try {
            const user = await apiService.getUser(userId);
            set(state => ({ users: [...state.users, user] }));
            return user;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return undefined;
        }
    },

    login: async (userInfo) => {
        try {
            // Optimization: If userInfo already has ID (Manual Login), skip sync
            if (userInfo.id) {
                set({ loading: true, error: null });

                // Optimistic update
                const userWithOnline = { ...userInfo, isOnline: true };

                set(state => {
                    const existingUserIndex = state.users.findIndex(u => u.id === userWithOnline.id);
                    let newUsers = [...state.users];
                    if (existingUserIndex >= 0) {
                        newUsers[existingUserIndex] = userWithOnline;
                    } else {
                        newUsers.push(userWithOnline);
                    }
                    return { currentUser: userWithOnline, users: newUsers, loading: false };
                });

                localStorage.setItem('currentUser', JSON.stringify(userWithOnline));
                // localStorage.setItem('sessionToken', userWithOnline.sessionToken); // REMOVED

                // Update online status in background
                apiService.updateUserOnlineStatus(userWithOnline.id, true).catch(err => {
                    console.error('Background online status update failed:', err);
                });

                return userWithOnline;
            }

            set({ loading: true, error: null });
            const user = await apiService.createOrUpdateUser(userInfo);
            // const sessionToken = await apiService.generateSessionToken(user.id); // REMOVED

            // Optimistic update: Set user immediately to unblock UI
            const userWithOnline = { ...user, isOnline: true };

            set(state => {
                const existingUserIndex = state.users.findIndex(u => u.id === user.id);
                let newUsers = [...state.users];
                if (existingUserIndex >= 0) {
                    newUsers[existingUserIndex] = userWithOnline;
                } else {
                    newUsers.push(userWithOnline);
                }
                return { currentUser: userWithOnline, users: newUsers, loading: false };
            });

            localStorage.setItem('currentUser', JSON.stringify(userWithOnline));
            // localStorage.setItem('sessionToken', sessionToken); // REMOVED

            // Update online status in background (Fire and forget)
            apiService.updateUserOnlineStatus(user.id, true).catch(err => {
                console.error('Background online status update failed:', err);
            });

            return userWithOnline;
        } catch (error: any) {
            set({ error: error.message || 'Error logging in', loading: false });
            throw error;
        }
    },

    logout: async () => {
        const { currentUser } = get();
        if (currentUser) {
            try {
                await apiService.logout(currentUser.id);
            } catch (error) {
                console.error('Error logging out:', error);
            }
        }

        // localStorage.removeItem('sessionToken'); // REMOVED
        localStorage.removeItem('currentUser');
        localStorage.removeItem('phoneVerification');

        set({ currentUser: null });
    },

    verifySession: async () => {
        // Try to authenticate with cookie only
        try {
            // Pass empty string or null, apiService will send empty body but include cookie
            const user = await apiService.authenticateWithToken('');
            if (user) {
                set({ currentUser: user });
                // Also refresh users list to ensure we have latest data
                get().fetchUsers();
            } else {
                // Invalid session
                localStorage.removeItem('currentUser');
                set({ currentUser: null });
            }
        } catch (error) {
            console.error('Session verification failed (Server Error):', error);
            // Do NOT logout on server error (429, 500). 
        } finally {
            set({ isCheckingSession: false });
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
        const pointsIncrement = currentUser.emailVerified ? 0 : 10;
        const optimisticUser = {
            ...currentUser,
            emailVerified: true,
            points: (currentUser.points || 0) + pointsIncrement
        };

        set(state => ({
            currentUser: optimisticUser,
            users: state.users.map(u => u.id === optimisticUser.id ? optimisticUser : u)
        }));
        localStorage.setItem('currentUser', JSON.stringify(optimisticUser));

        try {
            // 2. Background Re-fetch to ensure consistency
            // Just call verifySession to refresh from cookie
            const updatedUser = await apiService.authenticateWithToken('');
            if (updatedUser) {
                set(state => ({
                    currentUser: updatedUser,
                    users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
                }));
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error syncing user status after email verification:', error);
        }
    },

    togglePrivacy: async (field) => {
        const { currentUser } = get();
        if (!currentUser) return;

        // 1. Optimistic Update
        const newValue = !currentUser[field];
        const optimisticUser = { ...currentUser, [field]: newValue };

        set(state => ({
            currentUser: optimisticUser,
            users: state.users.map(u => u.id === optimisticUser.id ? optimisticUser : u)
        }));
        localStorage.setItem('currentUser', JSON.stringify(optimisticUser));

        try {
            // 2. API Call
            await apiService.updatePrivacy(currentUser.id, { [field]: newValue });
        } catch (error) {
            console.error(`Error updating privacy for ${field}:`, error);
            // Revert on error
            const revertedUser = { ...currentUser, [field]: !newValue };
            set(state => ({
                currentUser: revertedUser,
                users: state.users.map(u => u.id === revertedUser.id ? revertedUser : u)
            }));
            localStorage.setItem('currentUser', JSON.stringify(revertedUser));
        }
    }
}));
