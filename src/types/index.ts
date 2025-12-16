import { Chat } from '@google/genai';

// ============================================
// TIPOS DE ERROR
// ============================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  originalError?: unknown;
  timestamp?: Date;
}

// Códigos de error predefinidos
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Auth errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Data errors
  NOT_FOUND: 'NOT_FOUND',
  INVALID_DATA: 'INVALID_DATA',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Firebase errors
  FIREBASE_ERROR: 'FIREBASE_ERROR',
  FIRESTORE_ERROR: 'FIRESTORE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Convierte un error desconocido a AppError tipado
 */
export function toAppError(error: unknown, defaultCode: ErrorCode = ErrorCodes.UNKNOWN_ERROR): AppError {
  // Si ya es AppError, retornarlo
  if (isAppError(error)) {
    return error;
  }

  // Si es un Error estándar
  if (error instanceof Error) {
    return {
      code: defaultCode,
      message: error.message,
      severity: 'error',
      originalError: error,
      timestamp: new Date(),
    };
  }

  // Si es un string
  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: error,
      severity: 'error',
      timestamp: new Date(),
    };
  }

  // Si es un objeto con message
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      code: (error as any).code || defaultCode,
      message: String((error as any).message),
      severity: 'error',
      originalError: error,
      timestamp: new Date(),
    };
  }

  // Fallback
  return {
    code: defaultCode,
    message: 'An unknown error occurred',
    severity: 'error',
    originalError: error,
    timestamp: new Date(),
  };
}

/**
 * Type guard para verificar si es AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'severity' in error
  );
}

/**
 * Crea un AppError con valores específicos
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  severity: ErrorSeverity = 'error',
  originalError?: unknown
): AppError {
  return {
    code,
    message,
    severity,
    originalError,
    timestamp: new Date(),
  };
}

// ============================================
// TIPOS DE USUARIO
// ============================================

export interface User {
  id: number | string; // Puede ser number (legacy) o string (Firebase UID)
  uid?: string; // Firebase UID
  uniqueId?: string; // ID único generado para el dashboard dinámico (ej: "USER-123456789")
  role?: 'USER' | 'ADMIN';
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
  | 'Articulos Varios'
  | 'Servicios profesionales';

export interface Ad {
  id: number | string; // Puede ser number (legacy) o string (Firebase document ID)
  uniqueCode: string;
  title: string;
  description: string;
  details?: string;
  price: number;
  category: AdCategory;
  subcategory?: string;
  location?: string;
  sellerId: number | string; // Puede ser number (legacy) o string (Firebase UID)
  views: number;
  media: Media[];
  isFavorite?: boolean; // Indica si el usuario actual lo marcó como favorito
  isFeatured?: boolean;
  featuredExpiresAt?: Date | string;
  expiresAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  keywords?: string[]; // Palabras clave para búsqueda optimizada
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
  userId: number | string; // Puede ser number (legacy) o string (Firebase UID)
  text: string;
  sender: 'user' | 'seller' | 'buyer';
  timestamp: Date;
  isRead?: boolean;
}

export interface ChatLog {
  id: string;
  participantIds: (number | string)[]; // Puede ser number[] (legacy) o string[] (Firebase UID)
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  updatedAt: Date;
  isBlocked?: boolean;
  blockedBy?: number | string | null;
  ad?: {
    id: number | string;
    uniqueCode?: string;
    title?: string;
    price?: number;
    media?: Media[];
  };
}

export interface GeminiChatSession {
  chat: Chat;
  seller: User;
  buyer: User;
}
