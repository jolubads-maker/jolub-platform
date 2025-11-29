// Configuración de API para diferentes entornos
export const API_CONFIG = {
  // URL del backend en producción
  PRODUCTION_API_URL: 'https://jolubads.onrender.com/api',
  // URL del backend en desarrollo
  DEV_API_URL: 'http://localhost:4000/api'
};

// Determinar la URL correcta según el entorno
export const getApiUrl = () => {
  // PRIORIDAD 1: Detectar si estamos en localhost o red local (desarrollo)
  // Esto debe ir PRIMERO para forzar el uso del proxy de Vite (/api) y evitar problemas de CORS/Firewall
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.');

  if (isLocalhost) {
    console.log('🔧 Detectado desarrollo (LAN/Localhost) - Usando proxy /api');
    return '/api';
  }

  // PRIORIDAD 2: Variable de entorno (si existe y está configurada)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '') {
    console.log('🔧 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // PRIORIDAD 3: Cualquier otro dominio = producción
  console.log('🔧 Detectado producción - Usando proxy /api');
  return '/api';
};

// Obtener la URL base para Sockets (sin /api y sin proxy de Vercel)
export const getSocketUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.');

  if (isLocalhost) {
    // Use relative path to let Vite proxy handle it (fixes port 4000 firewall issues)
    return '';
  }

  // En producción, devolver la URL directa del backend (Render)
  // Quitamos '/api' de la URL de producción si está presente
  return API_CONFIG.PRODUCTION_API_URL.replace('/api', '');
};
