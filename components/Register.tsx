import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import GoogleIcon from './icons/GoogleIcon';
import AppleIcon from './icons/AppleIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import DemoLogin from './DemoLogin';

interface RegisterProps {
  onRegister: (userInfo: { 
    name: string; 
    avatar: string; 
    email: string;
    provider: 'google' | 'apple' | 'manual';
    providerId: string;
  }) => void;
  onBackToHome: () => void;
  onError?: (error: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBackToHome, onError }) => {
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

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
      
      onRegister({
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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-2xl">
        {/* Botón Regresar */}
        <button
          onClick={onBackToHome}
          className="flex items-center text-gray-400 hover:text-brand-primary transition-colors mb-6 group"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Regresar</span>
        </button>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-secondary mb-2">
            Crear Cuenta
          </h1>
          <p className="text-gray-400">
            Únete a Marketplace IA
          </p>
        </div>

        {loading && (
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Procesando registro...</p>
          </div>
        )}

        {showDemo ? (
          /* Modo Demo */
          <div className="space-y-4">
            <DemoLogin onLogin={onRegister} onError={onError} />
            
            <button
              onClick={() => setShowDemo(false)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-300 underline mt-4"
            >
              Volver a intentar con Google
            </button>
          </div>
        ) : (
          <>
            {/* Icono de Google destacado */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-6 rounded-full shadow-lg">
                <GoogleIcon className="w-16 h-16" />
              </div>
            </div>

            {/* Botón de Google con Icono */}
            <div className="space-y-4">
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  auto_select={false}
                  theme="filled_blue"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                  locale="es"
                />
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
                💡 Si tienes problemas con Google, usa el modo demo
              </p>
            </div>
          </>
        )}

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Al registrarte, aceptas nuestros{' '}
            <a href="#" className="text-brand-primary hover:underline">
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a href="#" className="text-brand-primary hover:underline">
              Política de Privacidad
            </a>
          </p>
        </div>

        {/* Link a login */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={onBackToHome}
              className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

