import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginProps {
  onLogin: (userInfo: { name: string; avatar: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Validation states
  // 'idle': No ha escrito o está vacío
  // 'loading': Verificando...
  // 'valid': El correo existe (Login permitido)
  // 'invalid': El correo NO existe (Mostrar error y sugerir registro)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setEmailStatus('idle');
        return;
      }

      setEmailStatus('loading');
      setLoginError(null); // Clear error on email change
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();

        // Para LOGIN, queremos que exists sea TRUE
        if (data.exists) {
          setEmailStatus('valid');
        } else {
          setEmailStatus('invalid');
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailStatus('idle'); // O manejar error de red
      }
    };

    const timeoutId = setTimeout(checkEmail, 800); // Debounce de 800ms
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailStatus !== 'valid') return;

    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Login exitoso
      onLogin(data);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = emailStatus === 'valid' && password.length > 0;

  return (
    <div className="min-h-screen bg-[#6e0ad6] flex flex-col items-center justify-center p-4 relative">
      {/* Botón Regresar */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white hover:text-gray-200 flex items-center gap-2 font-bold transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Regresar al Inicio
      </button>

      {/* Logo fuera del formulario */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {/* J */}
        <div className="w-12 h-12 bg-[#ea580c] rounded-xl flex items-center justify-center shadow-md">
          <span className="text-3xl font-black text-white">J</span>
        </div>

        {/* OLU */}
        <span className="text-2xl font-bold text-white tracking-widest px-1">OLU</span>

        {/* B */}
        <div className="w-12 h-12 bg-[#ea580c] rounded-xl flex items-center justify-center shadow-md">
          <span className="text-3xl font-black text-white">B</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Tarjeta Principal */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-base font-bold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all text-base
                    ${emailStatus === 'valid' ? 'border-green-500 focus:border-green-500 text-green-700' :
                      emailStatus === 'invalid' ? 'border-red-500 focus:border-red-500 text-red-700' :
                        'border-[#ea580c] focus:border-[#ea580c] text-gray-800' /* Default & Loading & Idle */
                    }`}
                  placeholder="tu@email.com"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailStatus === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
                  ) : emailStatus === 'valid' ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : emailStatus === 'invalid' ? (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </div>
              </div>
              {/* Mensaje de error si no existe */}
              <AnimatePresence>
                {emailStatus === 'invalid' && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm font-bold mt-1"
                  >
                    Correo electrónico no registrado
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-base font-bold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError(null); // Clear error on type
                  }}
                  required
                  disabled={emailStatus !== 'valid'}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-all text-base
                    ${emailStatus !== 'valid'
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : loginError
                        ? 'border-red-500 focus:border-red-500 text-red-700'
                        : 'border-[#ea580c] focus:border-[#ea580c] text-gray-800'
                    }`}
                  placeholder="••••••••"
                />
                {password.length >= 1 && emailStatus === 'valid' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ea580c] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Login Error Message */}
              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{loginError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-[#6e0ad6] hover:underline font-bold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full font-bold py-3 px-6 rounded-full transition-all duration-300 transform 
                ${!isFormValid
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ea580c] hover:bg-[#d9520b] text-white hover:scale-[1.02] shadow-lg'
                }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ingresando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">o</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Botón de Registro */}
          <motion.button
            animate={emailStatus === 'invalid' ? {
              scale: [1, 1.05, 1],
              boxShadow: ["0px 0px 0px rgba(110, 10, 214, 0)", "0px 0px 20px rgba(110, 10, 214, 0.5)", "0px 0px 0px rgba(110, 10, 214, 0)"]
            } : {}}
            transition={{ duration: 0.5, repeat: emailStatus === 'invalid' ? 2 : 0 }}
            onClick={() => navigate('/register')}
            className={`w-full border-2 font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-[1.02]
                ${emailStatus === 'invalid'
                ? 'bg-[#6e0ad6] text-white border-[#6e0ad6] shadow-xl'
                : 'bg-white text-[#6e0ad6] border-[#6e0ad6] hover:bg-[#6e0ad6] hover:text-white'
              }`}
          >
            Registro por primera vez
          </motion.button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white mt-6">
          Al continuar, aceptas nuestros Términos y Condiciones
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
