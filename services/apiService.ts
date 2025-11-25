import { getApiUrl } from '../config/api.config';
import { User, Ad, ChatLog, ChatMessage } from '../types';

const API_BASE = getApiUrl();
console.log('🌐 API URL configurada:', API_BASE);

class ApiService {
  // Usuarios
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('Error obteniendo usuarios');
    return response.json();
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/check-username?username=${encodeURIComponent(username)}`);
    if (!response.ok) throw new Error('Error verificando username');
    const data = await response.json();
    return data.available;
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/check-email?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Error verificando email');
    const data = await response.json();
    return data.available;
  }

  async getIpInfo(): Promise<{ ip: string; country: string; city?: string; region?: string }> {
    const response = await fetch(`${API_BASE}/get-ip-info`);
    if (!response.ok) throw new Error('Error obteniendo información de IP');
    return response.json();
  }

  async createOrUpdateUser(userData: {
    name: string;
    avatar: string;
    email?: string;
    provider?: 'google' | 'apple' | 'manual';
    providerId?: string;
    username?: string;
    ip?: string;
    country?: string;
  }): Promise<User> {
    console.log('📡 POST /api/users', userData);
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    console.log('📡 Response status:', response.status, response.statusText);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error creando usuario: ${response.status} ${errorText}`);
    }
    const user = await response.json();
    console.log('📡 Usuario recibido:', user);
    return user;
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<User> {
    const response = await fetch(`${API_BASE}/users/${userId}/online-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline })
    });
    if (!response.ok) throw new Error('Error actualizando estado');
    return response.json();
  }

  async verifyUserPhone(userId: number, phoneNumber: string): Promise<User> {
    const response = await fetch(`${API_BASE}/users/${userId}/verify-phone`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    if (!response.ok) throw new Error('Error verificando teléfono');
    return response.json();
  }

  // Anuncios
  async getAds(): Promise<Ad[]> {
    const response = await fetch(`${API_BASE}/ads`);
    if (!response.ok) throw new Error('Error obteniendo anuncios');
    return response.json();
  }

  async createAd(adData: {
    title: string;
    description: string;
    details?: string;
    price: number;
    sellerId: number;
    media: Array<{ type: 'image' | 'video'; url: string }>;
  }): Promise<Ad> {
    const response = await fetch(`${API_BASE}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adData)
    });
    if (!response.ok) throw new Error('Error creando anuncio');
    return response.json();
  }

  async incrementAdViews(adId: number): Promise<Ad> {
    const response = await fetch(`${API_BASE}/ads/${adId}/view`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Error incrementando vistas');
    return response.json();
  }

  // Chats
  async getUserChats(userId: number): Promise<ChatLog[]> {
    const response = await fetch(`${API_BASE}/users/${userId}/chats`);
    if (!response.ok) throw new Error('Error obteniendo chats');
    return response.json();
  }

  async createOrGetChat(participantIds: number[]): Promise<ChatLog> {
    const response = await fetch(`${API_BASE}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds })
    });
    if (!response.ok) throw new Error('Error creando chat');
    return response.json();
  }

  async sendMessage(chatId: string, userId: number, text: string, sender: string): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, sender })
    });
    if (!response.ok) throw new Error('Error enviando mensaje');
    return response.json();
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE}/chats/${chatId}/messages`);
    if (!response.ok) throw new Error('Error obteniendo mensajes');
    return response.json();
  }

  // Verificación SMS
  async sendVerificationCode(phoneNumber: string): Promise<{ ok: boolean; message?: string }> {
    const response = await fetch(`${API_BASE}/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error enviando código');
    return data;
  }

  async verifyCode(phoneNumber: string, code: string): Promise<{ ok: boolean; message?: string }> {
    const response = await fetch(`${API_BASE}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error verificando código');
    return data;
  }

  // Autenticación OAuth
  async authenticateWithToken(sessionToken: string): Promise<User | null> {
    const response = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    });
    if (!response.ok) return null;
    return response.json();
  }

  async generateSessionToken(userId: number): Promise<string> {
    console.log('📡 POST /api/users/${userId}/session-token');
    const response = await fetch(`${API_BASE}/users/${userId}/session-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('📡 Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error generando token:', errorText);
      throw new Error(`Error generando token de sesión: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log('📡 Token recibido');
    return data.sessionToken;
  }

  // Búsqueda de anuncios
  async searchAds(query: string): Promise<Ad[]> {
    const response = await fetch(`${API_BASE}/ads/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Error buscando anuncios');
    return response.json();
  }

  // ===== FAVORITOS =====

  // Agregar favorito
  async addFavorite(userId: number, adId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adId })
    });
    if (!response.ok) throw new Error('Error agregando favorito');
  }

  // Eliminar favorito
  async removeFavorite(userId: number, adId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/favorites?userId=${userId}&adId=${adId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error eliminando favorito');
  }

  // Obtener favoritos de un usuario
  async getUserFavorites(userId: number): Promise<Ad[]> {
    const response = await fetch(`${API_BASE}/users/${userId}/favorites`);
    if (!response.ok) throw new Error('Error obteniendo favoritos');
    return response.json();
  }

  // Obtener anuncios con información de favoritos del usuario
  async getAdsWithFavorites(userId: number, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    search?: string;
  }): Promise<Ad[]> {
    const params = new URLSearchParams({ userId: userId.toString() });

    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);
    }

    const response = await fetch(`${API_BASE}/ads?${params.toString()}`);
    if (!response.ok) throw new Error('Error obteniendo anuncios');
    return response.json();
  }
}

export const apiService = new ApiService();

