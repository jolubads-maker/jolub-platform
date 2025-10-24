import React, { useState } from 'react';

interface DemoLoginProps {
  onLogin: (userInfo: { 
    name: string; 
    avatar: string; 
    email: string;
    provider: 'google' | 'apple' | 'manual';
    providerId: string;
  }) => void;
  onError?: (error: string) => void;
}

const DemoLogin: React.FC<DemoLoginProps> = ({ onLogin, onError }) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleDemoLogin = () => {
    if (!name.trim()) {
      onError?.('Por favor ingresa tu nombre');
      return;
    }

    setLoading(true);
    
    // Simular login con datos demo
    setTimeout(() => {
      onLogin({
        name: name.trim(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random&color=fff`,
        email: email.trim() || `${name.trim().toLowerCase().replace(' ', '.')}@demo.com`,
        provider: 'manual',
        providerId: `demo-${Date.now()}`
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Bienvenido a Marketplace IA
        </h2>
        <p className="text-gray-400">
          Modo Demo - Ingresa tus datos para continuar
        </p>
      </div>

      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Iniciando sesión...</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email (opcional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={loading || !name.trim()}
          className="w-full bg-brand-primary hover:bg-brand-dark disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
        >
          {loading ? 'Iniciando sesión...' : 'Continuar en Modo Demo'}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>
          <span className="text-yellow-400">⚠️ Modo Demo:</span> Para usar Google/Apple OAuth, 
          configura las credenciales en <code className="bg-gray-700 px-2 py-1 rounded">config/oauth.ts</code>
        </p>
      </div>
    </div>
  );
};

export default DemoLogin;

