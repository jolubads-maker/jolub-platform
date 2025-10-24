// Configuración de OAuth
export const OAUTH_CONFIG = {
  // Tu Client ID de Google OAuth
  GOOGLE_CLIENT_ID: "780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com",
  
  // Reemplaza con tu Client ID de Apple Sign-In
  APPLE_CLIENT_ID: process.env.REACT_APP_APPLE_CLIENT_ID || "com.marketplace.ia",
  
  // Configuración de Apple Sign-In
  APPLE_CONFIG: {
    clientId: "com.marketplace.ia", // Reemplazar con tu Client ID real
    scope: "email name",
    redirectURI: window.location.origin,
    state: "state",
    nonce: "nonce",
    usePopup: true,
  }
};

// Instrucciones para configurar OAuth:
/*
1. GOOGLE OAUTH:
   - Ve a https://console.developers.google.com/
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Google+ 
   - Ve a "Credenciales" y crea un "ID de cliente OAuth 2.0"
   - Agrega tu dominio a los orígenes autorizados
   - Copia el Client ID y reemplaza "TU_GOOGLE_CLIENT_ID_AQUI"

2. APPLE SIGN-IN:
   - Ve a https://developer.apple.com/account/
   - Crea un nuevo App ID
   - Habilita "Sign In with Apple"
   - Crea un Service ID
   - Configura los dominios y URLs de redirección
   - Reemplaza "com.marketplace.ia" con tu Client ID real

3. VARIABLES DE ENTORNO:
   - Crea un archivo .env en la raíz del proyecto
   - Agrega: REACT_APP_GOOGLE_CLIENT_ID=tu_client_id_aqui
   - Agrega: REACT_APP_APPLE_CLIENT_ID=tu_apple_client_id_aqui
*/
