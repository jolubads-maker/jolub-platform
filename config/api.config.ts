// Configuración de API para diferentes entornos
export const API_CONFIG = {
  // URL del backend en producción
  PRODUCTION_API_URL: 'https://jolub-backend.onrender.com/api',
  // URL del backend en desarrollo
  DEV_API_URL: 'http://localhost:4000/api'
};

// Determinar la URL correcta según el entorno
export const getApiUrl = () => {
  // Si existe la variable de entorno, usarla (tiene prioridad)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en producción (Vercel), usar la URL de producción
  if (import.meta.env.PROD) {
    return API_CONFIG.PRODUCTION_API_URL;
  }
  
  // En desarrollo, usar localhost
  return API_CONFIG.DEV_API_URL;
};

