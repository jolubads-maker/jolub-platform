import { Chat } from '@google/genai';

export interface User {
  id: number;
  uniqueId?: string; // ID único generado para el dashboard dinámico (ej: "USER-123456789")
  username?: string;
  name: string;
  avatar: string;
  email?: string;
  password?: string;
  provider?: 'google' | 'apple' | 'manual';
  providerId?: string;
  sessionToken?: string;
  points: number;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
  ip?: string;
  country?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Media {
  type: 'image' | 'video';
  url: string;
}

export type AdCategory =
  | 'Bienes raíces'
  | 'Vehículos'
  | 'Electrónica'
  | 'Hogar'
  | 'Moda'
  | 'Deportes'
  | 'Juguetes'
  | 'Libros'
  | 'Servicios profesionales'
  | 'Articulos Varios'
  | 'Otros';

export interface Ad {
  id: number;
  uniqueCode: string;
  title: string;
  description: string;
  details?: string;
  price: number;
  category: AdCategory;
  subcategory?: string;
  location?: string;
  sellerId: number;
  views: number;
  media: Media[];
  isFavorite?: boolean; // Indica si el usuario actual lo marcó como favorito
  isFeatured?: boolean;
  featuredExpiresAt?: Date | string;
  expiresAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  seller?: User;
}

export type AdFormData = Omit<Ad, 'id' | 'sellerId' | 'views' | 'isFavorite' | 'uniqueCode'>;

export interface Favorite {
  id: number;
  userId: number;
  adId: number;
  createdAt: Date;
}


export enum View {
  List = 'LIST',
  Detail = 'DETAIL',
  Create = 'CREATE',
  Chat = 'CHAT',
  Login = 'LOGIN',
  Register = 'REGISTER',
  Dashboard = 'DASHBOARD',
}

export type ViewState =
  | { view: View.List }
  | { view: View.Detail; adId: number }
  | { view: View.Create }
  | { view: View.Chat; sellerId: number; buyerId: number; chatId: string; from?: 'dashboard' }
  | { view: View.Login }
  | { view: View.Register }
  | { view: View.Dashboard; userId: number; uniqueId: string };


export interface ChatMessage {
  id: string;
  chatId: string;
  userId: number;
  text: string;
  sender: 'user' | 'seller' | 'buyer';
  timestamp: Date;
  isRead?: boolean;
}

export interface ChatLog {
  id: string;
  participantIds: number[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  updatedAt: Date;
  isBlocked?: boolean;
  blockedBy?: number | null;
  ad?: {
    id: number;
    uniqueCode: string;
    title: string;
    price: number;
    media: Media[];
  };
}

export interface GeminiChatSession {
  chat: Chat;
  seller: User;
  buyer: User;
}
