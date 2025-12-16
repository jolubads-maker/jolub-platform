// Ad Store con Firebase Firestore
// Reemplaza el store anterior que usaba apiService

import { create } from 'zustand';
import { Ad, Media } from '../src/types';
import { adService } from '../services/firebaseService';
import { storageService } from '../services/storageService';

interface CreateAdParams {
    title: string;
    description: string;
    details?: string;
    price: number;
    sellerId: string; // Ahora es string (Firebase UID)
    media: Media[];
    category: Ad['category'];
    subcategory?: string;
    location?: string;
}

interface AdState {
    ads: Ad[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchAds: () => Promise<void>;
    createAd: (adData: CreateAdParams) => Promise<Ad>;
    incrementViews: (adId: string) => Promise<void>;
    searchAds: (query: string) => Promise<void>;
    fetchAdByUniqueCode: (uniqueCode: string) => Promise<Ad | null>;
    deleteAd: (adId: string) => Promise<void>;
    subscribeToAds: () => () => void;
}

export const useAdStore = create<AdState>((set, get) => ({
    ads: [],
    loading: false,
    error: null,

    fetchAds: async () => {
        set({ loading: true, error: null });
        try {
            const ads = await adService.getAds();
            set({ ads, loading: false });
        } catch (error: any) {
            console.error('Error fetching ads:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchAdByUniqueCode: async (uniqueCode: string) => {
        set({ loading: true, error: null });
        try {
            const ad = await adService.getAdByCode(uniqueCode);
            if (ad) {
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
        set({ loading: true, error: null });
        try {
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
            set(state => ({
                ads: state.ads.filter(ad => (ad.id as any) !== adId)
            }));
        } catch (error: any) {
            console.error('Error deleting ad:', error);
            throw error;
        }
    },

    // Suscripción en tiempo real a cambios en anuncios
    subscribeToAds: () => {
        const unsubscribe = adService.subscribeToAds((ads) => {
            set({ ads, loading: false });
        });
        return unsubscribe;
    }
}));
