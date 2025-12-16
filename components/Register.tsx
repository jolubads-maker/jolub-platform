import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { userService } from '../services/firebaseService';
import { notify } from '../services/notificationService';

interface RegisterProps {
  onRegister?: (userInfo: any) => void;
  onBackToHome: () => void;
  onError?: (error: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBackToHome }) => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loading, error, setError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Validation states
  const [emailExists, setEmailExists] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Debounced email check
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const exists = await userService.checkEmailExists(email);
        setEmailExists(exists);
      } catch (e) {
        console.error('Error checking email:', e);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const exists = await userService.checkUsernameExists(username);
        setUsernameExists(exists);
      } catch (e) {
        console.error('Error checking username:', e);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const isFormValid =
    username.length >= 3 &&
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword &&
    gender !== '' &&
    !emailExists &&
    !usernameExists;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!isFormValid) return;

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    try {
      const user = await register({
        email: email.trim(),
        password,
        name: username.trim()
      });

      if (user) {
        notify.success('¡Cuenta creada! Revisa tu email para verificar tu cuenta.');
        if (onRegister) onRegister(user);
        navigate(`/dashboard/${user.uniqueId || 'USER-' + user.id}`);
      }
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    setLocalError(null);
    setError(null);

    try {
      const user = await loginWithGoogle();
      if (user) {
        if (onRegister) onRegister(user);
        navigate(`/dashboard/${user.uniqueId || 'USER-' + user.id}`);
      }
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#6e0ad6] flex flex-col items-center justify-center p-4 font-sans relative">

      {/* Botón Regresar */}
      <button
        onClick={onBackToHome}
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
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">

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

          {/* Google Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Registrarse con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">o con email</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username & Email Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 uppercase ml-1">Usuario</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none transition-all text-sm pr-10 ${usernameExists ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#6e0ad6]'
                      }`}
                    placeholder="usuario123"
                    minLength={3}
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    </div>
                  )}
                  {!checkingUsername && usernameExists && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                {usernameExists && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1"
                  >
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    Este usuario ya está registrado
                  </motion.p>
                )}
                {username.length > 0 && username.length < 3 && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">Mínimo 3 caracteres</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 uppercase ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none transition-all text-sm pr-10 ${emailExists ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#6e0ad6]'
                      }`}
                    placeholder="hola@ejemplo.com"
                  />
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    </div>
                  )}
                  {!checkingEmail && emailExists && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                {emailExists && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1"
                  >
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    Este email ya está registrado
                  </motion.p>
                )}
              </div>
            </div>

            {/* Gender Selection - Simplified */}
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-700 uppercase ml-1">Sexo</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${gender === 'male'
                      ? 'border-[#6e0ad6] bg-[#6e0ad6] text-white shadow-lg shadow-purple-500/20'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Hombre
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${gender === 'female'
                      ? 'border-[#f28000] bg-[#f28000] text-white shadow-lg shadow-orange-500/20'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Mujer
                </button>
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 uppercase ml-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none focus:border-[#6e0ad6] focus:ring-0 transition-all text-sm"
                  placeholder="••••••"
                  minLength={6}
                />
                {password.length > 0 && password.length < 6 && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">Mínimo 6 caracteres</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 uppercase ml-1">Confirmar</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-gray-50 border-2 ${confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none focus:border-[#6e0ad6] focus:ring-0 transition-all text-sm`}
                  placeholder="••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full font-black py-3 rounded-xl shadow-lg transform active:scale-[0.98] transition-all ${isFormValid
                    ? 'bg-[#f28000] hover:bg-[#d97200] text-white shadow-orange-500/20'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creando cuenta...</span>
                  </div>
                ) : (
                  'Completar Registro'
                )}
              </button>

              {/* Validation message when button is disabled */}
              {(emailExists || usernameExists) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-amber-600 text-xs font-bold text-center mt-3 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {emailExists ? 'El email ya está registrado' : 'El usuario ya está registrado'}
                </motion.p>
              )}

              {/* Password Mismatch Error */}
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs font-bold text-center mt-2 animate-pulse">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs font-bold">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => navigate('/login')} className="text-[#6e0ad6] font-black hover:underline">
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
