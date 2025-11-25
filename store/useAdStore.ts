import { create } from 'zustand';
import { Ad, AdFormData } from '../types';
import { apiService } from '../services/apiService';

interface AdState {
    ads: Ad[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchAds: () => Promise<void>;
    createAd: (adData: any) => Promise<Ad>;
    incrementViews: (adId: number) => Promise<void>;
    searchAds: (query: string) => Promise<void>;
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

    createAd: async (adData) => {
        try {
            const newAd = await apiService.createAd(adData);
            set(state => ({ ads: [newAd, ...state.ads] }));
            return newAd;
        } catch (error) {
            throw error;
        }
    },

    incrementViews: async (adId) => {
        try {
            const updatedAd = await apiService.incrementAdViews(adId);
            set(state => ({
                ads: state.ads.map(ad => ad.id === adId ? updatedAd : ad)
            }));
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    },

    searchAds: async (query) => {
        set({ loading: true });
        try {
            const ads = await apiService.searchAds(query);
            set({ ads, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    }
}));
