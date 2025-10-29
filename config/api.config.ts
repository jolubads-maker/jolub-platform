// Configuración de API para diferentes entornos
export const API_CONFIG = {
  // URL del backend en producción
  PRODUCTION_API_URL: 'https://jolub-backend.onrender.com/api',
  // URL del backend en desarrollo
  DEV_API_URL: 'http://localhost:4000/api'
};

// Determinar la URL correcta según el entorno
export const getApiUrl = () => {
  // PRIORIDAD 1: Variable de entorno (si existe y está configurada)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '') {
    console.log('🔧 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // PRIORIDAD 2: Detectar si estamos en localhost (desarrollo)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    console.log('🔧 Detectado localhost - Usando:', API_CONFIG.DEV_API_URL);
    return API_CONFIG.DEV_API_URL;
  }
  
  // PRIORIDAD 3: Cualquier otro dominio = producción
  console.log('🔧 Detectado producción - Usando:', API_CONFIG.PRODUCTION_API_URL);
  return API_CONFIG.PRODUCTION_API_URL;
};

