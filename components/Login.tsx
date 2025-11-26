import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [showCaptcha, setShowCaptcha] = useState(false);

  // Validation states
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Check email availability
  React.useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setEmailExists(false);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        setEmailExists(data.exists);
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailExists(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      alert('Por favor completa el reCAPTCHA');
      return;
    }

    setIsLoading(true);

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
      alert(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = emailExists && password.length > 0 && captchaToken;

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
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-base ${emailExists ? 'border-green-500 focus:ring-green-500 text-green-700' :
                    isCheckingEmail ? 'border-yellow-400 focus:ring-yellow-400' :
                      'border-gray-300 focus:ring-[#6e0ad6] text-purple-700'
                    }`}
                  placeholder="tu@email.com"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingEmail ? (
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : emailExists ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </div>
              </div>
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
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => {
                    if (password.length > 0) setShowCaptcha(true);
                  }}
                  required
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0ad6] focus:border-transparent transition-all text-base text-purple-700"
                  placeholder="••••••••"
                />
                {password.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700 transition-colors"
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

            {/* reCAPTCHA - Only show if password is entered */}
            <AnimatePresence>
              {showCaptcha && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex justify-center py-2 overflow-hidden"
                >
                  <div className="transform scale-90 origin-center">
                    <ReCAPTCHA
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                      onChange={setCaptchaToken}
                      theme="light"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-[#f28000] hover:bg-[#d97200] text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-white border-2 border-[#6e0ad6] text-[#6e0ad6] font-bold py-3 px-6 rounded-full hover:bg-[#6e0ad6] hover:text-white transition-all duration-300 transform hover:scale-[1.02]"
          >
            Registro por primera vez
          </button>
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