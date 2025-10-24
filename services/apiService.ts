// Servicio para manejar todas las llamadas a la API
const API_BASE = '/api';

export interface User {
  id: number;
  name: string;
  avatar: string;
  email?: string;
  provider?: 'google' | 'apple' | 'manual';
  providerId?: string;
  sessionToken?: string;
  points: number;
  phone?: string;
  phoneVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Ad {
  id: number;
  uniqueCode: string;
  title: string;
  description: string;
  details?: string;
  price: number;
  sellerId: number;
  views: number;
  media: Array<{ type: 'image' | 'video'; url: string }>;
  seller?: User;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'seller' | 'buyer';
  userId: number;
  timestamp: Date;
  user?: User;
}

export interface ChatLog {
  id: string;
  participants: Array<{
    userId: number;
    user: User;
  }>;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
}

class ApiService {
  // Usuarios
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('Error obteniendo usuarios');
    return response.json();
  }

  async createOrUpdateUser(userData: { 
    name: string; 
    avatar: string; 
    email?: string;
    provider?: 'google' | 'apple' | 'manual';
    providerId?: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Error creando usuario');
    return response.json();
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
    const response = await fetch(`${API_BASE}/users/${userId}/session-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Error generando token de sesión');
    const data = await response.json();
    return data.sessionToken;
  }

  // Búsqueda de anuncios
  async searchAds(query: string): Promise<Ad[]> {
    const response = await fetch(`${API_BASE}/ads/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Error buscando anuncios');
    return response.json();
  }
}

export const apiService = new ApiService();
export type { User, Ad, ChatLog, ChatMessage };

