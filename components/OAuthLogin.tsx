import React, { useState, useEffect } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import AppleSigninAuth from 'react-apple-signin-auth';
import GoogleIcon from './icons/GoogleIcon';
import AppleIcon from './icons/AppleIcon';
import DemoLogin from './DemoLogin';
import { OAUTH_CONFIG } from '../config/oauth';

interface OAuthLoginProps {
  onLogin: (userInfo: { 
    name: string; 
    avatar: string; 
    email: string;
    provider: 'google' | 'apple';
    providerId: string;
  }) => void;
  onError?: (error: string) => void;
}

const OAuthLogin: React.FC<OAuthLoginProps> = ({ onLogin, onError }) => {
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Verificar si las credenciales OAuth están configuradas
  const isOAuthConfigured = OAUTH_CONFIG.GOOGLE_CLIENT_ID !== 'demo-client-id';

  // Si no hay credenciales OAuth, mostrar modo demo automáticamente
  useEffect(() => {
    if (!isOAuthConfigured) {
      setShowDemo(true);
    }
  }, [isOAuthConfigured]);

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.('No se pudo obtener las credenciales de Google');
      return;
    }

    setLoading(true);
    
    try {
      // Decodificar el JWT token de Google
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const userInfo = JSON.parse(jsonPayload);
      
      onLogin({
        name: userInfo.name,
        avatar: userInfo.picture,
        email: userInfo.email,
        provider: 'google',
        providerId: userInfo.sub
      });
    } catch (error) {
      console.error('Error decodificando token de Google:', error);
      onError?.('Error procesando la información de Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    // Mostrar modo demo automáticamente si falla OAuth
    setShowDemo(true);
  };

  const handleAppleSuccess = (response: any) => {
    setLoading(true);
    
    try {
      // Procesar respuesta de Apple
      const userInfo = response.user;
      
      onLogin({
        name: userInfo.name || userInfo.email || 'Usuario Apple',
        avatar: userInfo.picture || '/default-avatar.png',
        email: userInfo.email,
        provider: 'apple',
        providerId: userInfo.sub || userInfo.id
      });
    } catch (error) {
      console.error('Error procesando respuesta de Apple:', error);
      onError?.('Error procesando la información de Apple');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleError = (error: any) => {
    console.error('Error Apple Sign-In:', error);
    onError?.('Error al iniciar sesión con Apple');
  };

  // Si está en modo demo, mostrar solo el DemoLogin
  if (showDemo) {
    return (
      <div className="space-y-4">
        <DemoLogin onLogin={onLogin} onError={onError} />
        
        <button
          onClick={() => setShowDemo(false)}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-300 underline mt-4"
        >
          Volver a intentar con Google o Apple
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Bienvenido a Marketplace IA
        </h2>
        <p className="text-gray-400">
          Inicia sesión para acceder a todas las funcionalidades
        </p>
      </div>

      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Procesando...</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Google Sign-In */}
        <div className="w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            auto_select={false}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="100%"
            locale="es"
          />
        </div>

        {/* Apple Sign-In */}
        <div className="w-full">
          <AppleSigninAuth
            authOptions={OAUTH_CONFIG.APPLE_CONFIG}
            uiType="dark"
            onSuccess={handleAppleSuccess}
            onError={handleAppleError}
            render={(props) => (
              <button
                {...props}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center space-x-3"
                disabled={loading}
              >
                <AppleIcon className="w-5 h-5" />
                <span>Continuar con Apple</span>
              </button>
            )}
          />
        </div>
      </div>

      {/* Separador */}
      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="px-4 text-gray-500 text-sm">o</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>

      {/* Botón para usar modo demo */}
      <button
        onClick={() => setShowDemo(true)}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
      >
        Usar Modo Demo
      </button>

      <p className="text-xs text-center text-gray-500 mt-4">
        💡 Si tienes problemas con Google o Apple, usa el modo demo
      </p>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>
          Al continuar, aceptas nuestros{' '}
          <a href="#" className="text-brand-primary hover:underline">
            Términos de Servicio
          </a>{' '}
          y{' '}
          <a href="#" className="text-brand-primary hover:underline">
            Política de Privacidad
          </a>
        </p>
      </div>
    </div>
  );
};

export default OAuthLogin;
