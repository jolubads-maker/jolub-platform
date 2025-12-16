// Ad Store con Firebase Firestore - Optimizado para reducir lecturas
// Implementa paginación con limit() y startAfter(), caché en memoria

import { create } from 'zustand';
import { Ad, Media } from '../src/types';
import { adService } from '../services/firebaseService';

const PAGE_SIZE = 20; // Límite de anuncios por página

interface CreateAdParams {
    title: string;
    description: string;
    details?: string;
    price: number;
    sellerId: string;
    media: Media[];
    category: Ad['category'];
    subcategory?: string;
    location?: string;
}

interface AdState {
    ads: Ad[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    lastFetchTime: number | null;
    lastDoc: any; // Último documento para paginación

    // Actions
    fetchAds: (forceRefresh?: boolean) => Promise<void>;
    loadMore: () => Promise<void>;
    createAd: (adData: CreateAdParams) => Promise<Ad>;
    incrementViews: (adId: string) => Promise<void>;
    searchAds: (query: string) => Promise<void>;
    fetchAdByUniqueCode: (uniqueCode: string) => Promise<Ad | null>;
    deleteAd: (adId: string) => Promise<void>;
    clearCache: () => void;
}

// Caché de tiempo: no recargar si pasaron menos de 5 minutos
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en ms

export const useAdStore = create<AdState>((set, get) => ({
    ads: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: true,
    lastFetchTime: null,
    lastDoc: null,

    // Fetch inicial con límite de 20 y caché
    fetchAds: async (forceRefresh = false) => {
        const { lastFetchTime, ads, loading } = get();

        // Si ya está cargando, no hacer nada
        if (loading) return;

        // Verificar caché: si hay datos y no ha pasado el tiempo de caché, no recargar
        const now = Date.now();
        if (!forceRefresh && ads.length > 0 && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
            console.log('📦 Usando caché de anuncios (sin lecturas Firestore)');
            return;
        }

        set({ loading: true, error: null });
        try {
            const result = await adService.getAdsPaginated(PAGE_SIZE);
            set({
                ads: result.ads,
                loading: false,
                hasMore: result.ads.length === PAGE_SIZE,
                lastDoc: result.lastDoc,
                lastFetchTime: Date.now()
            });
            console.log(`✅ Cargados ${result.ads.length} anuncios (limit: ${PAGE_SIZE})`);
        } catch (error: any) {
            console.error('Error fetching ads:', error);
            set({ error: error.message, loading: false });
        }
    },

    // Cargar más anuncios (paginación)
    loadMore: async () => {
        const { lastDoc, hasMore, loadingMore, loading, ads } = get();

        // Si no hay más, ya está cargando, o no hay lastDoc, no hacer nada
        if (!hasMore || loadingMore || loading || !lastDoc) {
            console.log('⏸️ No se puede cargar más:', { hasMore, loadingMore, loading, hasLastDoc: !!lastDoc });
            return;
        }

        set({ loadingMore: true });
        try {
            const result = await adService.getAdsPaginated(PAGE_SIZE, lastDoc);

            // Evitar duplicados
            const existingIds = new Set(ads.map(ad => ad.id));
            const newAds = result.ads.filter(ad => !existingIds.has(ad.id));

            set(state => ({
                ads: [...state.ads, ...newAds],
                loadingMore: false,
                hasMore: result.ads.length === PAGE_SIZE,
                lastDoc: result.lastDoc
            }));
            console.log(`➕ Cargados ${newAds.length} anuncios más (total: ${ads.length + newAds.length})`);
        } catch (error: any) {
            console.error('Error loading more ads:', error);
            set({ loadingMore: false });
        }
    },

    fetchAdByUniqueCode: async (uniqueCode: string) => {
        // Primero buscar en caché local
        const cachedAd = get().ads.find(ad => ad.uniqueCode === uniqueCode);
        if (cachedAd) {
            console.log('📦 Anuncio encontrado en caché local');
            return cachedAd;
        }

        set({ loading: true, error: null });
        try {
            const ad = await adService.getAdByCode(uniqueCode);
            if (ad) {
                // Agregar a caché local sin duplicar
                set(state => ({
                    ads: [ad, ...state.ads.filter(a => a.uniqueCode !== ad.uniqueCode)],
                    loading: false
                }));
            } else {
                set({ loading: false });
            }
            return ad;
        } catch (error: any) {
            console.error('Error fetching ad by code:', error);
            set({ error: error.message, loading: false });
            return null;
        }
    },

    createAd: async (adData: CreateAdParams) => {
        set({ loading: true, error: null });
        try {
            const newAd = await adService.createAd({
                title: adData.title,
                description: adData.description,
                details: adData.details,
                price: adData.price,
                category: adData.category,
                subcategory: adData.subcategory,
                location: adData.location,
                sellerId: adData.sellerId,
                media: adData.media
            });

            // Agregar al inicio de la lista local
            set(state => ({
                ads: [newAd, ...state.ads],
                loading: false
            }));

            return newAd;
        } catch (error: any) {
            console.error('Error creating ad:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    incrementViews: async (adId: string) => {
        try {
            await adService.incrementViews(adId);
            // Actualizar localmente sin re-fetch
            set(state => ({
                ads: state.ads.map(ad =>
                    (ad.id as any) === adId
                        ? { ...ad, views: (ad.views || 0) + 1 }
                        : ad
                )
            }));
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    },

    searchAds: async (query: string) => {
        if (!query.trim()) {
            // Si no hay query, usar caché
            return;
        }

        set({ loading: true, error: null });
        try {
            // Buscar primero en caché local
            const localResults = get().ads.filter(ad =>
                ad.title.toLowerCase().includes(query.toLowerCase()) ||
                ad.description.toLowerCase().includes(query.toLowerCase()) ||
                ad.category.toLowerCase().includes(query.toLowerCase())
            );

            if (localResults.length > 0) {
                console.log(`🔍 ${localResults.length} resultados en caché local`);
                set({ ads: localResults, loading: false });
                return;
            }

            // Si no hay resultados locales, buscar en Firestore
            const ads = await adService.searchAds(query);
            set({ ads, loading: false });
        } catch (error: any) {
            console.error('Error searching ads:', error);
            set({ error: error.message, loading: false });
        }
    },

    deleteAd: async (adId: string) => {
        try {
            await adService.deleteAd(adId);
            // Eliminar de caché local
            set(state => ({
                ads: state.ads.filter(ad => (ad.id as any) !== adId)
            }));
        } catch (error: any) {
            console.error('Error deleting ad:', error);
            throw error;
        }
    },

    // Limpiar caché manualmente
    clearCache: () => {
        set({
            ads: [],
            lastFetchTime: null,
            lastDoc: null,
            hasMore: true
        });
        console.log('🗑️ Caché de anuncios limpiada');
    }
}));
