import React, { useEffect, useRef, useCallback } from 'react';
import AppleIcon from './icons/AppleIcon';

// Declaramos el objeto 'google' del script global para que TypeScript no se queje.
declare const google: any;

interface LoginProps {
  onLogin: (userInfo: { name:string; avatar:string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback((response: any) => {
    // El 'credential' es un JSON Web Token (JWT). Lo decodificamos para obtener la información del usuario.
    const idToken = response.credential;
    // La información del usuario (payload) está en la segunda parte del token.
    const userObject = JSON.parse(atob(idToken.split('.')[1]));
    
    // Llamamos a la función onLogin con los datos del perfil de Google.
    onLogin({
      name: userObject.name,
      avatar: userObject.picture,
    });
  }, [onLogin]);

  useEffect(() => {
    // Nos aseguramos de que el script de Google se haya cargado.
    if (typeof google === 'undefined' || !googleButtonRef.current) {
      console.error("Google Identity Services script not loaded.");
      return;
    }

    // Inicializamos el cliente de identidad de Google.
    google.accounts.id.initialize({
      client_id: '780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com',
      callback: handleCredentialResponse,
    });

    // Renderizamos el botón de Google en el div que hemos preparado.
    google.accounts.id.renderButton(
      googleButtonRef.current,
      { 
        theme: 'filled_black', 
        size: 'large', 
        type: 'standard', 
        text: 'continue_with',
        logo_alignment: 'left'
      }
    );
    
  }, [handleCredentialResponse]);

  const handleAppleLogin = () => {
    // Mantenemos el login de Apple como una simulación por ahora.
    onLogin({ name: 'Ana Rodriguez', avatar: 'https://picsum.photos/seed/ana/100/100' });
  };

  return (
    <div className="max-w-sm mx-auto bg-gray-800 p-8 rounded-lg shadow-lg animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-brand-light">Bienvenido</h2>
        <p className="text-gray-400 mb-8">Elige un método para continuar</p>
      </div>
      <div className="space-y-4 flex flex-col items-center">
        {/* Este div contendrá el botón de Google renderizado por su script */}
        <div ref={googleButtonRef} className="w-full flex justify-center"></div>

        <div className="w-full my-2 flex items-center">
          <div className="flex-grow bg-gray-700 h-px"></div>
          <span className="text-gray-400 text-sm px-2">o</span>
          <div className="flex-grow bg-gray-700 h-px"></div>
        </div>

        <button
          onClick={handleAppleLogin}
          className="w-full max-w-[280px] flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
        >
          <AppleIcon className="w-6 h-6 mr-3" />
          Continuar con Apple
        </button>
      </div>
    </div>
  );
};

export default Login;