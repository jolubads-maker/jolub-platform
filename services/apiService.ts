import { getApiUrl } from '../config/api.config';
import { User, Ad, ChatLog, ChatMessage } from '../src/types';

const API_BASE = getApiUrl();
console.log('🌐 API URL configurada:', API_BASE);

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // If body is FormData, let browser set Content-Type
    if (options.body instanceof FormData) {
      delete (defaultHeaders as any)['Content-Type'];
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // CRITICAL: Send cookies with request
    };

    // Add Authorization header if token exists (Fallback for when cookies are blocked)
    const token = localStorage.getItem('sessionToken');
    if (token) {
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for uploads
    config.signal = controller.signal;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('La petición excedió el tiempo de espera (timeout)');
      }
      throw error;
    }
  }

  async uploadFile(formData: FormData): Promise<{ url: string }> {
    const response = await this.request('/upload', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Error subiendo archivo');
    return response.json();
  }

  // Generic HTTP Methods
  public async get<T>(endpoint: string): Promise<T> {
    const response = await this.request(endpoint, { method: 'GET' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error en la petición' }));
      throw new Error(error.message || `Error GET ${endpoint}`);
    }
    return response.json();
  }

  public async post<T>(endpoint: string, body?: any): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error en la petición' }));
      throw new Error(error.message || `Error POST ${endpoint}`);
    }
    return response.json();
  }

  public async put<T>(endpoint: string, body?: any): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error en la petición' }));
      throw new Error(error.message || `Error PUT ${endpoint}`);
    }
    return response.json();
  }

  public async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error en la petición' }));
      throw new Error(error.message || `Error DELETE ${endpoint}`);
    }
    return response.json();
  }

  // Usuarios
  async getUsers(): Promise<User[]> {
    const response = await this.request('/users');
    if (!response.ok) throw new Error('Error obteniendo usuarios');
    return response.json();
  }

  async getUser(userId: number): Promise<User> {
    const response = await this.request(`/users/${userId}`);
    if (!response.ok) throw new Error('Error obteniendo usuario');
    return response.json();
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const response = await this.request(`/check-username?username=${encodeURIComponent(username)}`);
    if (!response.ok) throw new Error('Error verificando username');
    const data = await response.json();
    return data.available;
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const response = await this.request(`/check-email?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Error verificando email');
    const data = await response.json();
    return data.available;
  }

  async getIpInfo(): Promise<{ ip: string; country: string; city?: string; region?: string }> {
    const response = await this.request('/get-ip-info');
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
    password?: string;
  }): Promise<User> {
    console.log('📡 POST /api/auth/sync', userData);
    const response = await this.request('/auth/sync', {
      method: 'POST',
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
    const response = await this.request(`/users/${userId}/online-status`, {
      method: 'PUT',
      body: JSON.stringify({ isOnline })
    });
    if (!response.ok) throw new Error('Error actualizando estado');
    return response.json();
  }

  async verifyUserPhone(userId: number, phoneNumber: string): Promise<User> {
    const response = await this.request(`/users/${userId}/verify-phone`, {
      method: 'PUT',
      body: JSON.stringify({ phoneNumber })
    });
    if (!response.ok) throw new Error('Error verificando teléfono');
    return response.json();
  }

  async updatePrivacy(userId: number, settings: { showEmail?: boolean; showPhone?: boolean }): Promise<User> {
    const response = await this.request(`/users/${userId}/privacy`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Error actualizando privacidad');
    return response.json();
  }

  async rateUser(userId: number, points: number): Promise<User> {
    const response = await this.request(`/users/${userId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ points })
    });
    if (!response.ok) throw new Error('Error calificando usuario');
    return response.json();
  }

  // Anuncios
  async getAds(): Promise<Ad[]> {
    const response = await this.request('/ads');
    if (!response.ok) throw new Error('Error obteniendo anuncios');
    return response.json();
  }

  async getAdByUniqueCode(uniqueCode: string): Promise<Ad> {
    const response = await this.request(`/ads/code/${uniqueCode}`);
    if (!response.ok) throw new Error('Error obteniendo anuncio');
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
    const response = await this.request('/ads', {
      method: 'POST',
      body: JSON.stringify(adData)
    });
    if (!response.ok) throw new Error('Error creando anuncio');
    return response.json();
  }

  async incrementAdViews(adId: number): Promise<Ad> {
    const response = await this.request(`/ads/${adId}/view`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Error incrementando vistas');
    return response.json();
  }

  // Chats
  async getUserChats(userId: number): Promise<ChatLog[]> {
    const response = await this.request(`/users/${userId}/chats`);
    if (!response.ok) throw new Error('Error obteniendo chats');
    return response.json();
  }

  async createOrGetChat(participantIds: number[], adId?: number, options?: { checkOnly?: boolean }): Promise<ChatLog | null> {
    const response = await this.request('/chats', {
      method: 'POST',
      body: JSON.stringify({ participantIds, adId, checkOnly: options?.checkOnly })
    });
    if (!response.ok) throw new Error('Error creando chat');
    return response.json();
  }

  async sendMessage(chatId: string, userId: number, text: string, sender: string): Promise<ChatMessage> {
    const response = await this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ userId, text, sender })
    });
    if (!response.ok) throw new Error('Error enviando mensaje');
    return response.json();
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const response = await this.request(`/chats/${chatId}/messages`);
    if (!response.ok) throw new Error('Error obteniendo mensajes');
    return response.json();
  }

  // Verificación SMS
  async sendVerificationCode(phoneNumber: string): Promise<{ ok: boolean; message?: string }> {
    const response = await this.request('/send-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error enviando código');
    return data;
  }

  async verifyCode(phoneNumber: string, code: string): Promise<{ ok: boolean; message?: string }> {
    const response = await this.request('/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error verificando código');
    return data;
  }

  // Autenticación OAuth
  async authenticateWithToken(sessionToken: string): Promise<User | null> {
    // Note: sessionToken might be empty if we rely purely on cookies now, 
    // but keeping the signature for compatibility if needed.
    // Actually, we can just send an empty body or check /users/me

    const response = await this.request('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }) // Still sending it if available, but backend checks cookie too
    });

    if (response.status === 401 || response.status === 403) {
      return null; // Token inválido o expirado
    }

    if (!response.ok) {
      throw new Error(`Error de servidor: ${response.status}`); // 429, 500, etc.
    }

    return response.json();
  }

  async generateSessionToken(userId: number): Promise<string> {
    console.log('📡 POST /api/users/${userId}/session-token');
    const response = await this.request(`/users/${userId}/session-token`, {
      method: 'POST'
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

  async logout(userId: number): Promise<void> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    if (!response.ok) throw new Error('Error cerrando sesión');
  }

  // Búsqueda de anuncios
  async searchAds(query: string): Promise<Ad[]> {
    const response = await this.request(`/ads/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Error buscando anuncios');
    return response.json();
  }

  // ===== FAVORITOS =====

  // Agregar favorito
  async addFavorite(userId: number, adId: number): Promise<void> {
    const response = await this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ userId, adId })
    });
    if (!response.ok) throw new Error('Error agregando favorito');
  }

  // Eliminar favorito
  async removeFavorite(userId: number, adId: number): Promise<void> {
    const response = await this.request(`/favorites?userId=${userId}&adId=${adId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error eliminando favorito');
  }

  // Obtener favoritos de un usuario
  async getUserFavorites(userId: number): Promise<Ad[]> {
    const response = await this.request(`/users/${userId}/favorites`);
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

    const response = await this.request(`/ads?${params.toString()}`);
    if (!response.ok) throw new Error('Error obteniendo anuncios');
    return response.json();
  }
}

export const apiService = new ApiService();

