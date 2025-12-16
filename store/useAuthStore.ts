// Authentication Store con Firebase - Migración Completa
// Reemplaza el sistema anterior basado en apiService

import { create } from 'zustand';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification
} from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { userService } from '../services/firebaseService';
import { User } from '../src/types';

// Tipo para el estado del store
interface AuthState {
    currentUser: User | null;
    firebaseUser: FirebaseUser | null;
    users: User[];
    loading: boolean;
    error: string | null;
    isCheckingSession: boolean;

    // Actions
    setError: (error: string | null) => void;
    setCurrentUser: (user: User | null) => void;
    setUsers: (users: User[]) => void;
    login: (credentials: { email: string; password: string }) => Promise<User | void>;
    loginWithGoogle: () => Promise<User | void>;
    register: (data: { email: string; password: string; name: string }) => Promise<User | void>;
    logout: () => Promise<void>;
    verifySession: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
    getUserById: (userId: string | number) => Promise<User | undefined>;
    updateUserStatus: (userId: string | number, isOnline: boolean) => Promise<void>;
}

// Función para convertir FirebaseUser a User del sistema
const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
    return {
        id: parseInt(firebaseUser.uid.slice(-8), 16) || Date.now(), // Generar ID numérico del UID
        uniqueId: `USER-${firebaseUser.uid.slice(-10).toUpperCase()}`,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        email: firebaseUser.email || undefined,
        avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=6e0ad6&color=fff`,
        emailVerified: firebaseUser.emailVerified,
        provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'manual',
        providerId: firebaseUser.uid,
        points: 0,
        isOnline: true,
        createdAt: new Date(),
    };
};

// Traducir errores de Firebase al español
function getSpanishErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'El correo electrónico no es válido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
        'auth/wrong-password': 'La contraseña es incorrecta',
        'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/operation-not-allowed': 'Operación no permitida',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/invalid-credential': 'Credenciales inválidas. Verifica tu email y contraseña',
        'auth/popup-closed-by-user': 'Ventana de login cerrada por el usuario',
    };

    for (const [code, message] of Object.entries(errorMessages)) {
        if (errorCode.includes(code)) {
            return message;
        }
    }

    return 'Ha ocurrido un error. Intenta de nuevo.';
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    firebaseUser: null,
    users: [],
    loading: false,
    error: null,
    isCheckingSession: true,

    setError: (error) => set({ error }),
    setCurrentUser: (user) => set({ currentUser: user }),
    setUsers: (users) => set({ users }),

    // Login con email y contraseña
    login: async (credentials) => {
        set({ loading: true, error: null });
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                credentials.email,
                credentials.password
            );
            const user = mapFirebaseUserToUser(userCredential.user);

            set({
                currentUser: user,
                firebaseUser: userCredential.user,
                loading: false,
                error: null
            });

            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (error: any) {
            const errorMessage = getSpanishErrorMessage(error.code || error.message);
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
        }
    },

    // Login con Google
    loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = mapFirebaseUserToUser(result.user);

            set({
                currentUser: user,
                firebaseUser: result.user,
                loading: false,
                error: null
            });

            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (error: any) {
            const errorMessage = getSpanishErrorMessage(error.code || error.message);
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
        }
    },

    // Registro de nuevo usuario
    register: async (data) => {
        set({ loading: true, error: null });
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // Actualizar el perfil con el nombre
            if (data.name) {
                await updateProfile(userCredential.user, {
                    displayName: data.name,
                    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6e0ad6&color=fff`
                });
            }

            // Enviar email de verificación
            await sendEmailVerification(userCredential.user);

            const user = mapFirebaseUserToUser(userCredential.user);
            user.name = data.name; // Asegurar el nombre

            set({
                currentUser: user,
                firebaseUser: userCredential.user,
                loading: false,
                error: null
            });

            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (error: any) {
            const errorMessage = getSpanishErrorMessage(error.code || error.message);
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
        }
    },

    // Cerrar sesión
    logout: async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionToken');
            set({
                currentUser: null,
                firebaseUser: null,
                error: null
            });
        } catch (error: any) {
            console.error('Error al cerrar sesión:', error);
            // Limpiar estado de todos modos
            localStorage.removeItem('currentUser');
            set({ currentUser: null, firebaseUser: null });
        }
    },

    // Verificar sesión (llamado por onAuthStateChanged)
    verifySession: async () => {
        // Esta función ahora es manejada por onAuthStateChanged
        // Se mantiene para compatibilidad con App.tsx
        return Promise.resolve();
    },

    // Enviar email para restablecer contraseña
    resetPassword: async (email: string) => {
        set({ loading: true, error: null });
        try {
            await sendPasswordResetEmail(auth, email);
            set({ loading: false });
        } catch (error: any) {
            const errorMessage = getSpanishErrorMessage(error.code || error.message);
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
        }
    },

    // Reenviar email de verificación
    sendVerificationEmail: async () => {
        const { firebaseUser } = get();
        if (firebaseUser) {
            try {
                await sendEmailVerification(firebaseUser);
            } catch (error: any) {
                throw new Error(getSpanishErrorMessage(error.code || error.message));
            }
        }
    },

    // Obtener usuario por ID (compatibilidad)
    getUserById: async (userId: string | number) => {
        const { users, currentUser } = get();
        const userIdStr = String(userId);

        // Primero buscar por providerId (Firebase UID)
        if (currentUser) {
            const currentUid = String(currentUser.providerId || currentUser.uid || currentUser.id);
            if (currentUid === userIdStr) {
                return currentUser;
            }
        }

        // Buscar en usuarios cargados
        let found = users.find(u => {
            const uid = String(u.providerId || u.uid || u.id);
            return uid === userIdStr || String(u.id) === userIdStr;
        });

        // Si no se encuentra, intentar cargar desde Firestore
        if (!found) {
            try {
                found = await userService.getUserById(userIdStr);
            } catch (e) {
                console.warn('Usuario no encontrado en Firestore:', userId);
            }
        }

        return found;
    },

    // Actualizar estado online (simplificado para Firebase)
    updateUserStatus: async (userId: number, isOnline: boolean) => {
        set(state => ({
            currentUser: state.currentUser?.id === userId
                ? { ...state.currentUser, isOnline }
                : state.currentUser
        }));
    },
}));

// ============================================
// LISTENER DE AUTENTICACIÓN (onAuthStateChanged)
// ============================================
// Se ejecuta automáticamente para mantener la sesión sincronizada

onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        // Usuario autenticado - Sincronizar con Firestore
        const user = mapFirebaseUserToUser(firebaseUser);

        // Crear o actualizar usuario en Firestore
        try {
            await userService.createOrUpdateUser({
                uid: firebaseUser.uid,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                emailVerified: user.emailVerified,
                provider: user.provider
            });
        } catch (error) {
            console.error('Error syncing user to Firestore:', error);
        }

        useAuthStore.setState({
            currentUser: { ...user, providerId: firebaseUser.uid },
            firebaseUser: firebaseUser,
            isCheckingSession: false,
            loading: false
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        // Usuario no autenticado
        useAuthStore.setState({
            currentUser: null,
            firebaseUser: null,
            isCheckingSession: false,
            loading: false
        });
        localStorage.removeItem('currentUser');
    }
});

export type { AuthState };
