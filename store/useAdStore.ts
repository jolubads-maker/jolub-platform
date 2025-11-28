import { create } from 'zustand';
import { Ad, AdFormData, Media } from '../src/types';
import { apiService } from '../services/apiService';

interface CreateAdParams {
    title: string;
    description: string;
    details?: string;
    price: number;
    sellerId: number;
    media: Media[];
    category: Ad['category'];
    location?: string;
}

interface AdState {
    ads: Ad[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchAds: () => Promise<void>;
    createAd: (adData: CreateAdParams) => Promise<Ad>;
    incrementViews: (adId: number) => Promise<void>;
    searchAds: (query: string) => Promise<void>;
    fetchAdByUniqueCode: (uniqueCode: string) => Promise<Ad | null>;
}

export const useAdStore = create<AdState>((set, get) => ({
    ads: [],
    loading: false,
    error: null,

    fetchAds: async () => {
        set({ loading: true });
        try {
            const ads = await apiService.getAds();
            set({ ads, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchAdByUniqueCode: async (uniqueCode: string) => {
        set({ loading: true });
        try {
            const ad = await apiService.getAdByUniqueCode(uniqueCode);
            set(state => ({
                ads: [ad, ...state.ads.filter(a => a.id !== ad.id)],
                loading: false
            }));
            return ad;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            return null;
        }
    },

    createAd: async (adData: CreateAdParams) => {
        try {
            // Ensure media is correctly typed for the API
            const apiAdData = {
                ...adData,
                media: adData.media.map(m => ({ type: m.type, url: m.url }))
            };
            const newAd = await apiService.createAd(apiAdData);
            set(state => ({ ads: [newAd, ...state.ads] }));
            return newAd;
        } catch (error) {
            throw error;
        }
    },

    incrementViews: async (adId: number) => {
        try {
            const updatedAd = await apiService.incrementAdViews(adId);
            set(state => ({
                ads: state.ads.map(ad => ad.id === adId ? updatedAd : ad)
            }));
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    },

    searchAds: async (query: string) => {
        set({ loading: true });
        try {
            const ads = await apiService.searchAds(query);
            set({ ads, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    }
}));

