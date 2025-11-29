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
            // We need an endpoint for getting a single user. 
            // Assuming apiService.getUser(id) exists or we can use getUsers temporarily if endpoint missing
            // But for now let's assume we need to implement it in apiService too.
            // Wait, apiService.getUsers() gets ALL. 
            // Let's check apiService.ts again. It only has getUsers().
            // I will add getUser(id) to apiService as well.
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
            // Optimization: If userInfo already has ID and SessionToken (Manual Login), skip sync
            if (userInfo.id && userInfo.sessionToken) {
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
                localStorage.setItem('sessionToken', userWithOnline.sessionToken);

                // Update online status in background
                apiService.updateUserOnlineStatus(userWithOnline.id, true).catch(err => {
                    console.error('Background online status update failed:', err);
                });

                return userWithOnline;
            }

            set({ loading: true, error: null });
            const user = await apiService.createOrUpdateUser(userInfo);
            const sessionToken = await apiService.generateSessionToken(user.id);

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
            localStorage.setItem('sessionToken', sessionToken);

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
                } else {
                    // Invalid token
                    localStorage.removeItem('sessionToken');
                    localStorage.removeItem('currentUser');
                    set({ currentUser: null });
                }
            } catch (error) {
                console.error('Session verification failed (Server Error):', error);
                // Do NOT logout on server error (429, 500). 
                // Only logout if we explicitly got null (401/403) handled above.
                // We keep the local user state if possible, or just stop checking.
            } finally {
                set({ isCheckingSession: false });
            }
        } else {
            // Fallback to legacy local storage if needed, or just clear
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    // We don't trust local storage without token validation for security
                    // But for UX we might keep it briefly. 
                    // Ideally, we clear it if no token.
                    // For this fix, we will clear it to enforce token auth.
                    localStorage.removeItem('currentUser');
                } catch (e) {
                    localStorage.removeItem('currentUser');
                }
            }
            set({ currentUser: null, isCheckingSession: false });
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
