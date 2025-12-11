// Configuración de API para diferentes entornos
export const API_CONFIG = {
  // URL del backend en producción
  PRODUCTION_API_URL: 'https://jolub-backend-pne5.onrender.com/api',
  // URL del backend en desarrollo
  DEV_API_URL: 'http://localhost:4000/api'
};

// Determinar la URL correcta según el entorno
// Determinar la URL correcta según el entorno
export const getApiUrl = () => {
  const hostname = window.location.hostname;

  // PRIORIDAD 1: Detectar si estamos en localhost o red local (desarrollo)
  const isLocalhost = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.');

  if (isLocalhost) {
    // Si es una IP de red local (ej: 192.168.0.19), conectamos directo al puerto 4000
    // para evitar problemas con el proxy de Vite que a veces falla en LAN.
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      console.log(`🔧 Detectado LAN (${hostname}) - Conectando directo al puerto 4000`);
      return `http://${hostname}:4000/api`;
    }

    // Para localhost/127.0.0.1 seguimos usando el proxy por comodidad
    console.log('🔧 Detectado Localhost - Usando proxy /api');
    return '/api';
  }

  // PRIORIDAD 2: Variable de entorno
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '') {
    const envUrlIsLocal = import.meta.env.VITE_API_URL.includes('localhost') ||
      import.meta.env.VITE_API_URL.includes('127.0.0.1');

    if (!envUrlIsLocal) {
      console.log('🔧 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
      return import.meta.env.VITE_API_URL;
    }
  }

  // PRIORIDAD 3: Producción
  console.log('🔧 Detectado producción - Usando URL de producción hardcoded');
  return API_CONFIG.PRODUCTION_API_URL;
};

// Obtener la URL base para Sockets
export const getSocketUrl = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.');

  if (isLocalhost) {
    // Si es LAN, conectar directo al puerto 4000
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return `http://${hostname}:4000`;
    }
    // Localhost usa proxy
    return '';
  }

  return API_CONFIG.PRODUCTION_API_URL.replace('/api', '');
};
