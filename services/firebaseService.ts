// Firebase Service - Operaciones con Firestore
// Reemplaza apiService.ts para comunicación directa con Firebase

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    increment,
    Timestamp,
    DocumentData,
    QuerySnapshot,
    startAfter,
    DocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '../src/config/firebase';
import { User, Ad, ChatLog, ChatMessage, Media } from '../src/types';

// ============================================
// USUARIOS
// ============================================

export const userService = {
    // Crear o actualizar usuario después del login
    async createOrUpdateUser(userData: Partial<User> & { uid: string }): Promise<User> {
        const userRef = doc(db, 'users', userData.uid);
        const userSnap = await getDoc(userRef);

        const now = Timestamp.now();

        if (userSnap.exists()) {
            // Usuario existe, actualizar
            await updateDoc(userRef, {
                ...userData,
                isOnline: true,
                lastSeen: now,
                updatedAt: now
            });
            const updated = await getDoc(userRef);
            return { id: 0, ...updated.data() } as User;
        } else {
            // Crear nuevo usuario
            const newUser: DocumentData = {
                uid: userData.uid,
                uniqueId: `USER-${userData.uid.slice(-10).toUpperCase()}`,
                name: userData.name || 'Usuario',
                email: userData.email || null,
                avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'U')}&background=6e0ad6&color=fff`,
                emailVerified: userData.emailVerified || false,
                provider: userData.provider || 'manual',
                points: 0,
                isOnline: true,
                lastSeen: now,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(userRef, newUser);
            return { id: 0, ...newUser } as User;
        }
    },

    async getUser(uid: string): Promise<User | null> {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { id: 0, ...userSnap.data() } as User;
        }
        return null;
    },

    async updateUserStatus(uid: string, isOnline: boolean): Promise<void> {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            isOnline,
            lastSeen: serverTimestamp()
        });
    },

    async updateUser(uid: string, data: Partial<User>): Promise<void> {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // Alias para compatibilidad con useAuthStore
    async getUserById(uid: string): Promise<User | undefined> {
        const user = await this.getUser(uid);
        return user || undefined;
    },

    // Verificar si email ya existe en Firestore
    async checkEmailExists(email: string): Promise<boolean> {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase().trim()), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    },

    // Verificar si username ya existe en Firestore
    async checkUsernameExists(username: string): Promise<boolean> {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('name', '==', username.trim()), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    },

    // Obtener usuario por email
    async getUserByEmail(email: string): Promise<User | null> {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase().trim()), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as User;
    }
};

// ============================================
// ANUNCIOS
// ============================================

export const adService = {
    // Obtener todos los anuncios (legacy - usar getAdsPaginated)
    async getAds(): Promise<Ad[]> {
        const adsRef = collection(db, 'ads');
        const q = query(adsRef, orderBy('createdAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);

        const ads: Ad[] = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const seller = await userService.getUser(data.sellerId);
            ads.push({
                id: docSnap.id as any,
                uniqueCode: data.uniqueCode,
                title: data.title,
                description: data.description,
                details: data.details,
                price: data.price,
                category: data.category,
                subcategory: data.subcategory,
                location: data.location,
                sellerId: data.sellerId,
                views: data.views || 0,
                media: data.media || [],
                isFeatured: data.isFeatured || false,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                seller: seller || undefined
            } as Ad);
        }

        return ads;
    },

    // Obtener anuncios con paginación (optimizado)
    async getAdsPaginated(pageSize: number = 20, lastDocument?: DocumentSnapshot): Promise<{ ads: Ad[], lastDoc: DocumentSnapshot | null }> {
        const adsRef = collection(db, 'ads');

        // Construir query con o sin cursor
        let q;
        if (lastDocument) {
            q = query(adsRef, orderBy('createdAt', 'desc'), startAfter(lastDocument), limit(pageSize));
        } else {
            q = query(adsRef, orderBy('createdAt', 'desc'), limit(pageSize));
        }

        const snapshot = await getDocs(q);
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        const ads: Ad[] = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as any;
            // Cargar seller para mostrar info en tarjetas
            let seller = undefined;
            if (data.sellerId) {
                try {
                    seller = await userService.getUser(data.sellerId);
                } catch (e) {
                    console.warn('No se pudo cargar seller para anuncio:', docSnap.id);
                }
            }
            ads.push({
                id: docSnap.id as any,
                uniqueCode: data.uniqueCode,
                title: data.title,
                description: data.description,
                details: data.details,
                price: data.price,
                category: data.category,
                subcategory: data.subcategory,
                location: data.location,
                sellerId: data.sellerId,
                views: data.views || 0,
                media: data.media || [],
                isFeatured: data.isFeatured || false,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                seller: seller || undefined
            } as Ad);
        }

        return { ads, lastDoc };
    },

    // Obtener anuncio por código único
    async getAdByCode(uniqueCode: string): Promise<Ad | null> {
        const adsRef = collection(db, 'ads');
        const q = query(adsRef, where('uniqueCode', '==', uniqueCode), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        const seller = await userService.getUser(data.sellerId);

        return {
            id: docSnap.id as any,
            uniqueCode: data.uniqueCode,
            title: data.title,
            description: data.description,
            details: data.details,
            price: data.price,
            category: data.category,
            subcategory: data.subcategory,
            location: data.location,
            sellerId: data.sellerId,
            views: data.views || 0,
            media: data.media || [],
            isFeatured: data.isFeatured || false,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            seller: seller || undefined
        } as Ad;
    },

    // Crear anuncio
    async createAd(adData: {
        title: string;
        description: string;
        details?: string;
        price: number;
        category: string;
        subcategory?: string;
        location?: string;
        sellerId: string;
        media: Media[];
    }): Promise<Ad> {
        const adsRef = collection(db, 'ads');
        const uniqueCode = `AD-${Date.now().toString().slice(-5)}${Math.random().toString(36).slice(-3).toUpperCase()}`;

        // Stop words en español para filtrar
        const stopWords = new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
            'de', 'del', 'al', 'a', 'ante', 'bajo', 'con', 'contra',
            'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'según',
            'sin', 'sobre', 'tras', 'que', 'cual', 'cuyo', 'donde',
            'como', 'cuando', 'cuanto', 'y', 'o', 'u', 'ni', 'pero',
            'si', 'no', 'muy', 'más', 'menos', 'ya', 'es', 'son',
            'ser', 'estar', 'fue', 'sido', 'era', 'han', 'ha', 'he',
            'hay', 'este', 'esta', 'estos', 'estas', 'ese', 'esa',
            'esos', 'esas', 'aquel', 'aquella', 'mi', 'tu', 'su',
            'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'ellos'
        ]);

        // Generar keywords a partir de title, category, description, subcategory y location
        const generateKeywords = (text: string): string[] => {
            return text
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                .replace(/[^a-z0-9\s]/g, ' ') // Solo alfanuméricos
                .split(/\s+/)
                .filter(word => word.length >= 2 && !stopWords.has(word));
        };

        const allText = [
            adData.title,
            adData.category,
            adData.description,
            adData.subcategory || '',
            adData.location || ''
        ].join(' ');

        const keywords = [...new Set(generateKeywords(allText))].slice(0, 50); // Máx 50 keywords

        // Filtrar campos undefined (Firestore no acepta undefined)
        const cleanData: Record<string, any> = {};
        Object.entries(adData).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanData[key] = value;
            }
        });

        const newAd = {
            ...cleanData,
            uniqueCode,
            keywords, // Agregar keywords para búsqueda
            views: 0,
            isFeatured: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(adsRef, newAd);

        return {
            id: docRef.id as any,
            ...cleanData,
            uniqueCode,
            keywords,
            views: 0,
            isFeatured: false,
            createdAt: new Date()
        } as Ad;
    },

    // Incrementar vistas
    async incrementViews(adId: string): Promise<void> {
        const adRef = doc(db, 'ads', adId);
        await updateDoc(adRef, {
            views: increment(1)
        });
    },

    // Buscar anuncios (optimizado con array-contains)
    async searchAds(searchQuery: string): Promise<Ad[]> {
        // Normalizar término de búsqueda
        const searchTerm = searchQuery
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9]/g, '') // Solo alfanuméricos
            .trim();

        if (!searchTerm || searchTerm.length < 2) {
            return [];
        }

        // Usar array-contains para búsqueda eficiente
        const adsRef = collection(db, 'ads');
        const q = query(
            adsRef,
            where('keywords', 'array-contains', searchTerm),
            orderBy('createdAt', 'desc'),
            limit(50) // Limitar resultados
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date()
            } as Ad;
        });
    },

    // Eliminar anuncio
    async deleteAd(adId: string): Promise<void> {
        const adRef = doc(db, 'ads', adId);
        await deleteDoc(adRef);
    },

    // Suscribirse a cambios en anuncios (tiempo real)
    subscribeToAds(callback: (ads: Ad[]) => void): () => void {
        const adsRef = collection(db, 'ads');
        const q = query(adsRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, async (snapshot) => {
            const ads: Ad[] = [];
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                ads.push({
                    id: docSnap.id as any,
                    uniqueCode: data.uniqueCode,
                    title: data.title,
                    description: data.description,
                    price: data.price,
                    category: data.category,
                    location: data.location,
                    sellerId: data.sellerId,
                    views: data.views || 0,
                    media: data.media || [],
                    createdAt: data.createdAt?.toDate()
                } as Ad);
            }
            callback(ads);
        });
    }
};

// ============================================
// CHAT
// ============================================

export const chatService = {
    // Crear o obtener chat existente
    async getOrCreateChat(participantIds: string[], adId?: string): Promise<string> {
        const chatsRef = collection(db, 'chats');
        const sortedIds = [...participantIds].sort();
        const chatId = sortedIds.join('_');

        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            await setDoc(chatRef, {
                participantIds: sortedIds,
                adId: adId || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        return chatId;
    },

    // Enviar mensaje
    async sendMessage(chatId: string, userId: string, text: string, sender: 'buyer' | 'seller'): Promise<ChatMessage> {
        const messagesRef = collection(db, 'chats', chatId, 'messages');

        const message = {
            text,
            userId,
            sender,
            isRead: false,
            timestamp: serverTimestamp()
        };

        const docRef = await addDoc(messagesRef, message);

        // Actualizar lastMessage en el chat
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return {
            id: docRef.id,
            chatId,
            userId: userId as any,
            text,
            sender,
            isRead: false,
            timestamp: new Date()
        };
    },

    // Obtener mensajes de un chat
    async getMessages(chatId: string): Promise<ChatMessage[]> {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                chatId,
                userId: data.userId,
                text: data.text,
                sender: data.sender,
                isRead: data.isRead || false,
                timestamp: data.timestamp?.toDate() || new Date()
            };
        });
    },

    // Obtener chats de un usuario
    async getUserChats(userId: string): Promise<ChatLog[]> {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participantIds', 'array-contains', userId));
        const snapshot = await getDocs(q);

        const chats: ChatLog[] = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const messages = await this.getMessages(docSnap.id);

            chats.push({
                id: docSnap.id,
                participantIds: data.participantIds,
                messages,
                lastMessage: messages[messages.length - 1],
                updatedAt: data.updatedAt?.toDate() || new Date()
            });
        }

        return chats;
    },

    // Suscribirse a mensajes en tiempo real
    subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages: ChatMessage[] = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    chatId,
                    userId: data.userId,
                    text: data.text,
                    sender: data.sender,
                    isRead: data.isRead || false,
                    timestamp: data.timestamp?.toDate() || new Date()
                };
            });
            callback(messages);
        });
    },

    // Marcar mensajes como leídos
    async markAsRead(chatId: string, userId: string): Promise<void> {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, where('userId', '!=', userId), where('isRead', '==', false));
        const snapshot = await getDocs(q);

        const updates = snapshot.docs.map(docSnap =>
            updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { isRead: true })
        );

        await Promise.all(updates);
    },

    // Suscribirse a chats del usuario en tiempo real
    subscribeToUserChats(userId: string, callback: (chats: ChatLog[]) => void): () => void {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participantIds', 'array-contains', userId), orderBy('updatedAt', 'desc'));

        return onSnapshot(q, async (snapshot) => {
            const chats: ChatLog[] = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                // Obtener últimos mensajes para cada chat
                const messagesRef = collection(db, 'chats', docSnap.id, 'messages');
                const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(20));
                const messagesSnap = await getDocs(messagesQuery);

                const messages: ChatMessage[] = messagesSnap.docs.reverse().map(msgDoc => {
                    const msgData = msgDoc.data();
                    return {
                        id: msgDoc.id,
                        chatId: docSnap.id,
                        userId: msgData.userId,
                        text: msgData.text,
                        sender: msgData.sender,
                        isRead: msgData.isRead || false,
                        timestamp: msgData.timestamp?.toDate() || new Date()
                    };
                });

                chats.push({
                    id: docSnap.id,
                    participantIds: data.participantIds,
                    messages,
                    lastMessage: messages[messages.length - 1],
                    updatedAt: data.updatedAt?.toDate() || new Date()
                });
            }

            callback(chats);
        });
    }
};

// ============================================
// FAVORITOS
// ============================================

export const favoriteService = {
    async addFavorite(userId: string, adId: string): Promise<void> {
        const favoriteRef = doc(db, 'favorites', `${userId}_${adId}`);
        await setDoc(favoriteRef, {
            userId,
            adId,
            createdAt: serverTimestamp()
        });
    },

    async removeFavorite(userId: string, adId: string): Promise<void> {
        const favoriteRef = doc(db, 'favorites', `${userId}_${adId}`);
        await deleteDoc(favoriteRef);
    },

    async getUserFavorites(userId: string): Promise<string[]> {
        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(docSnap => docSnap.data().adId);
    },

    async isFavorite(userId: string, adId: string): Promise<boolean> {
        const favoriteRef = doc(db, 'favorites', `${userId}_${adId}`);
        const favoriteSnap = await getDoc(favoriteRef);
        return favoriteSnap.exists();
    }
};

// Exportar todos los servicios
export const firebaseService = {
    user: userService,
    ad: adService,
    chat: chatService,
    favorite: favoriteService
};

export default firebaseService;
