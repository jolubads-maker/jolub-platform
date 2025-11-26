import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

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

const Register: React.FC<RegisterProps> = ({ onRegister, onBackToHome }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de validación
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // IP y país
  const [ipInfo, setIpInfo] = useState<{ ip: string; country: string; city?: string; region?: string } | null>(null);

  // Obtener IP y país al montar el componente
  useEffect(() => {
    const fetchIpInfo = async () => {
      try {
        const info = await apiService.getIpInfo();
        console.log('📍 Información de IP obtenida:', info);
        setIpInfo(info);
      } catch (error) {
        console.error('Error obteniendo IP info:', error);
      }
    };
    fetchIpInfo();
  }, []);

  // Validar username con debounce
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const available = await apiService.checkUsernameAvailability(username);
        setUsernameAvailable(available);
      } catch (error) {
        console.error('Error verificando username:', error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Validar email con debounce
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const available = await apiService.checkEmailAvailability(email);
        setEmailAvailable(available);
      } catch (error) {
        console.error('Error verificando email:', error);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const isFormValid =
    usernameAvailable === true &&
    emailAvailable === true &&
    password.length >= 6 &&
    password === confirmPassword &&
    gender !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    if (password !== confirmPassword) {
      return;
    }

    setIsLoading(true);

    try {
      // Generar avatar basado en género (Estilo Adventurer Neutral)
      let avatarUrl = `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${username}`;

      if (gender === 'male') {
        avatarUrl += '';
      } else if (gender === 'female') {
        avatarUrl += '&mouthColor=9e0101';
      }

      const userInfo = {
        username: username.trim(),
        name: username.trim(),
        email: email.trim(),
        avatar: avatarUrl,
        provider: 'manual' as const,
        providerId: email,
        ip: ipInfo?.ip || 'Unknown',
        country: ipInfo?.country || 'Unknown'
      };

      onRegister(userInfo);
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error al crear la cuenta. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-gray-800 font-black text-xl tracking-wide">Crear nueva cuenta</p>
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
                    className={`w-full bg-gray-50 border-2 ${usernameAvailable === false ? 'border-red-300 bg-red-50' : usernameAvailable === true ? 'border-green-300 bg-green-50' : 'border-gray-200'} rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none focus:border-[#6e0ad6] focus:ring-0 transition-all text-sm`}
                    placeholder="usuario123"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <div className="w-3 h-3 border-2 border-[#6e0ad6] border-t-transparent rounded-full animate-spin" />
                    ) : usernameAvailable === true ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : null}
                  </div>
                </div>
                {usernameAvailable === false && <p className="text-[10px] text-red-500 font-bold ml-1">Ocupado</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 uppercase ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-gray-50 border-2 ${emailAvailable === false ? 'border-red-300 bg-red-50' : emailAvailable === true ? 'border-green-300 bg-green-50' : 'border-gray-200'} rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none focus:border-[#6e0ad6] focus:ring-0 transition-all text-sm`}
                    placeholder="hola@ejemplo.com"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingEmail ? (
                      <div className="w-3 h-3 border-2 border-[#6e0ad6] border-t-transparent rounded-full animate-spin" />
                    ) : emailAvailable === true ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : null}
                  </div>
                </div>
                {emailAvailable === false && <p className="text-[10px] text-red-500 font-bold ml-1">Registrado</p>}
              </div>
            </div>

            {/* Gender Selection - Icons Only */}
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-700 uppercase ml-1">Sexo</label>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`w-12 h-12 rounded-full border-2 font-bold text-2xl transition-all flex items-center justify-center ${gender === 'male'
                    ? 'border-[#6e0ad6] bg-[#6e0ad6] text-white shadow-lg shadow-purple-500/30 scale-110'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:scale-105'
                    }`}
                  title="Masculino"
                >
                  👨
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`w-12 h-12 rounded-full border-2 font-bold text-2xl transition-all flex items-center justify-center ${gender === 'female'
                    ? 'border-[#f28000] bg-[#f28000] text-white shadow-lg shadow-orange-500/30 scale-110'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:scale-105'
                    }`}
                  title="Femenino"
                >
                  👩
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
                />
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
                disabled={isLoading || !isFormValid}
                className="w-full bg-[#f28000] hover:bg-[#d97200] text-white font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando cuenta...' : 'Completar Registro'}
              </button>

              {/* Error Message for Password Mismatch */}
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

