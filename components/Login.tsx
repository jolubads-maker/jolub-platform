import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { userService } from '../services/firebaseService';
import ForgotPasswordModal from './ForgotPasswordModal';

// Rate limiter config
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 segundos

interface LoginProps {
  onLogin?: (userInfo: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loading, error, setError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Email validation state
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingLockTime, setRemainingLockTime] = useState(0);

  // Debounced email check
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailExists(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const exists = await userService.checkEmailExists(email);
        setEmailExists(exists);
      } catch (e) {
        console.error('Error checking email:', e);
        setEmailExists(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || !lockoutEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutEndTime - Date.now()) / 1000));
      setRemainingLockTime(remaining);

      if (remaining === 0) {
        setIsLocked(false);
        setLockoutEndTime(null);
        setFailedAttempts(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutEndTime]);

  // Validate form before attempting Firebase call
  const validateForm = useCallback((): boolean => {
    if (!email.trim()) {
      setLocalError('El email es obligatorio');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setLocalError('Ingresa un email válido');
      return false;
    }
    if (!password) {
      setLocalError('La contraseña es obligatoria');
      return false;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  }, [email, password]);

  // Handle failed login attempt
  const handleFailedAttempt = useCallback((errorMessage: string) => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockEndTime = Date.now() + LOCKOUT_DURATION_MS;
      setIsLocked(true);
      setLockoutEndTime(lockEndTime);
      setRemainingLockTime(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      setLocalError(`Demasiados intentos fallidos. Espera ${Math.ceil(LOCKOUT_DURATION_MS / 1000)} segundos.`);
      console.warn(`🔒 Login bloqueado por ${LOCKOUT_DURATION_MS / 1000}s después de ${newAttempts} intentos fallidos`);
    } else {
      setLocalError(`${errorMessage} (Intento ${newAttempts}/${MAX_FAILED_ATTEMPTS})`);
    }
  }, [failedAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    // Check if locked out
    if (isLocked) {
      setLocalError(`Espera ${remainingLockTime} segundos antes de intentar de nuevo.`);
      return;
    }

    // Validate form BEFORE calling Firebase (saves API calls)
    if (!validateForm()) {
      return;
    }

    try {
      const user = await login({ email, password });
      if (user) {
        // Reset attempts on successful login
        setFailedAttempts(0);
        if (onLogin) onLogin(user);
        navigate(`/dashboard/${user.uniqueId || 'USER-' + user.id}`);
      }
    } catch (err: any) {
      handleFailedAttempt(err.message || 'Error al iniciar sesión');
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setError(null);

    try {
      const user = await loginWithGoogle();
      if (user) {
        if (onLogin) onLogin(user);
        navigate(`/dashboard/${user.uniqueId || 'USER-' + user.id}`);
      }
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || error;
  const isFormValid = email.includes('@') && password.length >= 6 && emailExists === true;

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

      {/* Logo */}
      <div className="flex items-center justify-center gap-1 mb-8">
        <div className="w-12 h-12 bg-[#ea580c] rounded-xl flex items-center justify-center shadow-md">
          <span className="text-3xl font-black text-white">J</span>
        </div>
        <span className="text-2xl font-bold text-white tracking-widest px-1">OLU</span>
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

          {/* Error Display */}
          <AnimatePresence>
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
              >
                {displayError}
              </motion.div>
            )}
          </AnimatePresence>

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
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-all text-base text-gray-800 placeholder-gray-400 ${emailExists === false
                    ? 'border-amber-400 focus:border-amber-500'
                    : emailExists === true
                      ? 'border-green-400 focus:border-green-500'
                      : 'border-[#ea580c] focus:border-[#d9520b]'
                    }`}
                  placeholder="tu@email.com"
                  required
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingEmail && (
                    <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  )}
                  {!checkingEmail && emailExists === true && (
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!checkingEmail && emailExists === false && (
                    <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Email not found message */}
              {emailExists === false && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <p className="text-amber-700 text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Este email no está registrado
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="mt-2 text-[#6e0ad6] font-bold text-sm hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Crear una cuenta nueva
                  </button>
                </motion.div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-base font-bold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-[#ea580c] rounded-xl focus:outline-none focus:border-[#d9520b] transition-all text-base text-gray-800 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ea580c] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-[#6e0ad6] font-bold hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all transform ${isFormValid
                ? 'bg-[#6e0ad6] hover:bg-[#5808ab] text-white hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="text-gray-400 text-sm">o</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              ¿No tienes cuenta?{' '}
              <button onClick={() => navigate('/register')} className="text-[#6e0ad6] font-bold hover:underline">
                Regístrate
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};

export default Login;
