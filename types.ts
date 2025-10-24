import { Chat } from '@google/genai';

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

export interface Media {
  type: 'image' | 'video';
  url: string;
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
  media: Media[];
}

export type AdFormData = Omit<Ad, 'id' | 'sellerId' | 'views'>;


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
  | { view: View.Dashboard };


export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'seller' | 'buyer';
  userId: number;
  timestamp: Date;
}

export interface ChatLog {
  participantIds: number[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
}

export interface GeminiChatSession {
  chat: Chat;
  seller: User;
  buyer: User;
}