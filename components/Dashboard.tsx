import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { User, Ad, ChatLog } from '../types';
import AdCard from './AdCard';
import StarIcon from './icons/StarIcon';
import MessageIcon from './icons/MessageIcon';
import LockIcon from './icons/LockIcon';
import EyeIcon from './icons/EyeIcon';

interface DashboardProps {
  currentUser: User;
  userAds: Ad[];
  userChats: ChatLog[];
  users: User[];
  onPhoneVerified: (phoneNumber: string) => void;
  onEmailVerified: () => void;
  onOpenChat?: (otherUserId: number) => void;
  onLogout?: () => void;
}

const PhoneVerification: React.FC<{ onPhoneVerified: (phoneNumber: string) => void }> = ({ onPhoneVerified }) => {
  const [step, setStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
  const [countryCode, setCountryCode] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const buildE164 = () => `+${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

  // Cargar datos guardados al montar el componente
  React.useEffect(() => {
    const savedData = localStorage.getItem('phoneVerification');
    if (savedData) {
      try {
        const { countryCode: savedCountry, phone: savedPhone, step: savedStep } = JSON.parse(savedData);
        setCountryCode(savedCountry || '');
        setPhone(savedPhone || '');
        setStep(savedStep || 'enterPhone');
      } catch (e) {
        console.log('No hay datos guardados');
      }
    }
  }, []);

  // Guardar datos en localStorage
  const saveToStorage = (data: any) => {
    localStorage.setItem('phoneVerification', JSON.stringify(data));
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!countryCode || !phone) {
      setError('Ingresa el código de país y tu teléfono.');
      return;
    }

    try {
      setLoading(true);
      const phoneNumber = buildE164();
      const res = await fetch('/api/send-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error);
        } else {
          setError(data.error || 'No se pudo enviar el SMS');
        }
        return;
      }

      setSuccess(`Código enviado por SMS a ${phoneNumber}`);
      setStep('enterCode');
      saveToStorage({ countryCode, phone, step: 'enterCode' });

    } catch (err: any) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code.trim()) {
      setError('Ingresa el código de verificación');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/verify-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: buildE164(), code })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código inválido');
        return;
      }

      setSuccess('¡Teléfono verificado exitosamente!');
      localStorage.removeItem('phoneVerification'); // Limpiar datos guardados
      setTimeout(() => onPhoneVerified(buildE164()), 1000);

    } catch (err: any) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl max-w-md w-full mx-auto"
    >
      <div className="flex items-center mb-4">
        <div className="p-2 bg-[#6e0ad6] rounded-xl mr-3 shadow-lg shadow-[#6e0ad6]/30">
          <span className="text-xl">📱</span>
        </div>
        <h2 className="text-lg font-bold text-gray-800">Verifica tu teléfono</h2>
      </div>

      {/* Mensajes de estado */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'enterPhone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Código (52)"
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              className="w-24 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl p-3 focus:ring-2 focus:ring-[#6e0ad6]/50 focus:border-[#6e0ad6] transition-all outline-none"
              required
            />
            <input
              type="text"
              placeholder="Número de teléfono"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl p-3 focus:ring-2 focus:ring-[#6e0ad6]/50 focus:border-[#6e0ad6] transition-all outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6e0ad6] hover:bg-[#5b00b3] disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#6e0ad6]/20"
          >
            {loading ? 'Enviando...' : 'Enviar Código'}
          </button>
        </form>
      )}

      {step === 'enterCode' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl p-3 text-center tracking-[0.5em] text-xl font-mono focus:ring-2 focus:ring-[#6e0ad6]/50 focus:border-[#6e0ad6] transition-all outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-500/20"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('enterPhone');
              setError('');
              setSuccess('');
            }}
            className="w-full text-gray-500 hover:text-[#6e0ad6] text-sm font-medium transition-colors"
          >
            Cambiar número
          </button>
        </form>
      )}
    </motion.div>
  );
};


const EmailVerificationModal: React.FC<{ currentUser: User, onEmailVerified: () => void, onClose: () => void }> = ({ currentUser, onEmailVerified, onClose }) => {
  const [step, setStep] = useState<'initial' | 'enterCode'>('initial');
  const [email, setEmail] = useState(currentUser.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo enviar el correo');
        return;
      }

      setSuccess(`Código enviado por correo a ${email}`);
      setStep('enterCode');
    } catch (err: any) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code.trim()) {
      setError('Ingresa el código de verificación');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código inválido');
        return;
      }

      setSuccess('¡Correo verificado! Ya puedes chatear con el vendedor');
      setTimeout(() => {
        onEmailVerified();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#6e0ad6]/10 rounded-full flex items-center justify-center mb-4 text-3xl">
              ✉️
            </div>
            <h2 className="text-2xl font-black text-gray-800 text-center">Verificación de Correo</h2>
            <p className="text-gray-500 text-center text-sm mt-2">
              {step === 'initial' ? 'Confirma tu correo para activar todas las funciones.' : `Ingresa el código enviado a ${email}`}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                <p className="text-red-600 text-sm font-bold">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-center">
                <p className="text-green-600 text-sm font-bold">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'initial' ? (
            <div className="space-y-4">
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full bg-[#6e0ad6] hover:bg-[#5b00b3] disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#6e0ad6]/30 transform hover:-translate-y-1"
              >
                {loading ? 'Enviando...' : 'Enviar Código de Verificación'}
              </button>
              <button
                onClick={onClose}
                className="w-full text-gray-500 hover:text-gray-700 font-medium py-2"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <input
                type="text"
                placeholder="A1B2C3"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#6e0ad6] text-gray-800 placeholder-gray-300 rounded-xl p-4 text-center tracking-[0.5em] text-2xl font-black outline-none transition-colors uppercase"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30 transform hover:-translate-y-1"
              >
                {loading ? 'Verificando...' : 'Confirmar Código'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('initial'); setError(''); }}
                className="w-full text-[#6e0ad6] hover:underline font-bold text-sm text-center"
              >
                ¿No recibiste el código? Reintentar
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ currentUser, userAds, userChats, users, onPhoneVerified, onEmailVerified, onOpenChat, onLogout }) => {

  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const closeLightbox = () => {
    setSelectedAd(null);
    setSelectedMediaIndex(0);
  };

  // --- Highlight Ad State ---
  const [highlightAd, setHighlightAd] = useState<Ad | null>(null);
  const [highlightDuration, setHighlightDuration] = useState('1');
  const [highlightTermsAccepted, setHighlightTermsAccepted] = useState(false);

  const handleHighlight = (ad: Ad) => {
    setHighlightAd(ad);
    setHighlightDuration('1');
    setHighlightTermsAccepted(false);
  };
  // --------------------------

  // --- Email Verification Modal State ---
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  // --------------------------------------

  const goPrevMedia = () => {
    if (!selectedAd) return;
    const total = selectedAd.media.length;
    setSelectedMediaIndex((idx) => (idx - 1 + total) % total);
  };

  const goNextMedia = () => {
    if (!selectedAd) return;
    const total = selectedAd.media.length;
    setSelectedMediaIndex((idx) => (idx + 1) % total);
  };

  const requestFullscreen = () => {
    const el = mediaContainerRef.current as any;
    if (!el) return;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (fn) fn.call(el);
  };

  const getOtherParticipant = (chat: ChatLog) => {
    const otherId = chat.participantIds.find(id => id !== currentUser.id);
    return users.find(user => user.id === otherId);
  };

  const handleLogout = async () => {
    // Confirmar antes de cerrar sesión
    const confirmed = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (!confirmed) {
      return;
    }

    // Llamar a la función de logout si está disponible
    if (onLogout) {
      try {
        await onLogout();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  };

  const navigate = useNavigate();

  // 🔧 CONFIGURACIÓN CLOUDINARY (Misma que AdForm)
  const CLOUDINARY_CLOUD_NAME = 'dim5dxlil';
  const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      // 1. Subir a Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      const newAvatarUrl = data.secure_url;

      // 2. Actualizar en Backend
      const updateResponse = await fetch(`http://localhost:4000/api/users/${currentUser.id}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatarUrl })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Error al actualizar el avatar en el servidor');
      }

      // 3. Actualizar estado local
      const updatedUser = { ...currentUser, avatar: newAvatarUrl };
      localStorage.setItem('marketplace_user', JSON.stringify(updatedUser));

      // Notificar éxito
      alert('Avatar actualizado correctamente');

      // Forzar recarga para sincronizar con App.tsx
      window.location.reload();

    } catch (error: any) {
      console.error('Error actualizando avatar:', error);
      alert(`Error: ${error.message || 'No se pudo actualizar la imagen'}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* HEADER OLX STYLE (Copied from HomePage) */}
      <header className="sticky top-0 z-50 w-full bg-[#6e0ad6] shadow-lg mb-8">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">

          {/* LOGO */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-4xl font-black text-white tracking-tighter">JOLUB</h1>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-6 text-white font-semibold ml-auto">
            <button onClick={() => navigate('/')} className="hover:text-gray-200 transition-colors">
              Inicio
            </button>
            <div className="flex items-center gap-3 cursor-pointer group relative">
              <span className="hidden lg:block truncate max-w-[100px]">{currentUser.name}</span>
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:border-white transition-all"
                />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${currentUser.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12 relative">

        {/* WELCOME MESSAGE (Outside Box) */}
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight drop-shadow-sm">
            Bienvenido a tu centro de control
          </h2>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* 1. PERFIL (Horizontal Layout) */}
          <motion.div
            layoutId="profile-card"
            className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#6e0ad6] to-[#4a0099] rounded-[2rem] p-6 relative overflow-hidden group shadow-[0_20px_50px_-12px_rgba(110,10,214,0.5)] hover:shadow-[0_20px_60px_-12px_rgba(110,10,214,0.7)] transition-all duration-500 flex items-center"
          >
            {/* Futuristic Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-700" />

            {/* ID (Top Right) */}
            <div className="absolute top-6 right-6 inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/80 backdrop-blur-md">
              ID: {currentUser.uniqueId || `USER-${currentUser.id}`}
            </div>

            <div className="relative z-10 flex flex-row items-center gap-6 w-full">

              {/* Avatar & Status (Left) */}
              <div className="relative flex-shrink-0 cursor-pointer group/avatar" onClick={handleAvatarClick}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-50" />
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className={`relative w-24 h-24 rounded-full border-4 border-white/20 object-cover shadow-2xl transition-all duration-300 group-hover/avatar:border-white/50 group-hover/avatar:scale-105 ${isUploadingAvatar ? 'opacity-50 grayscale' : ''}`}
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/30 rounded-full">
                    <span className="text-white text-xs font-bold">Cambiar</span>
                  </div>
                )}
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#5b00b3] ${currentUser.isOnline ? 'bg-green-400' : 'bg-gray-400'} z-30`} />
              </div>

              {/* User Info (Right of Avatar) */}
              <div className="flex flex-col items-start">
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg">{currentUser.name}</h1>

                {/* Verification Status */}
                <div className="flex flex-col gap-1 mt-2">
                  {currentUser.emailVerified ? (
                    <div className="flex items-center gap-1.5 text-green-400">
                      <span className="text-sm font-bold tracking-wide drop-shadow-sm">✉️ Email Verificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-yellow-300">
                      <span className="text-sm font-bold">✉️ Email Pendiente</span>
                    </div>
                  )}

                  {currentUser.phoneVerified ? (
                    <div className="flex items-center gap-1.5 text-green-400">
                      <span className="text-sm font-bold tracking-wide drop-shadow-sm">📱 Teléfono Verificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-yellow-300">
                      <span className="text-sm font-bold">📱 Teléfono Pendiente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. STATS: PUNTOS */}
          <motion.div
            whileHover={{ y: -5 }}
            className="col-span-1 bg-gradient-to-br from-[#6e0ad6] to-[#4a0099] rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(110,10,214,0.4)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl text-yellow-300 backdrop-blur-sm">
                <StarIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-white/90 text-lg">Reputación</span>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2 drop-shadow-md">{currentUser.points}</div>
              <div className="w-full bg-black/30 rounded-full h-2 mt-2 overflow-hidden backdrop-blur-sm">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${Math.min((currentUser.points / 1000) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-white/60 mt-3 font-medium uppercase tracking-wider">Puntos de confianza</p>
            </div>
          </motion.div>

          {/* 3. STATS: ANUNCIOS */}
          <motion.div
            whileHover={{ y: -5 }}
            className="col-span-1 bg-gradient-to-br from-[#6e0ad6] to-[#4a0099] rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(110,10,214,0.4)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl text-blue-300 backdrop-blur-sm">
                <EyeIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-white/90 text-lg">Anuncios</span>
            </div>
            <div>
              <div className="text-5xl font-black text-white mb-2 drop-shadow-md">{userAds.length}</div>
              <p className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wider">Activos en el mercado</p>
            </div>
          </motion.div>

          {/* 4. VERIFICACIONES (Floating/Overlay) */}
          <div className="col-span-1 md:col-span-4 flex flex-col md:flex-row justify-center gap-6 my-4 relative z-20">
            {!currentUser.emailVerified && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowEmailVerifyModal(true)}
                className="w-full max-w-md bg-white border-l-4 border-yellow-400 rounded-2xl p-6 shadow-lg cursor-pointer flex items-center justify-between group relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-50" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full group-hover:bg-yellow-200 transition-colors">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Verificar Correo</h3>
                    <p className="text-sm text-gray-500">Necesario para chatear</p>
                  </div>
                </div>
                <div className="relative z-10 text-yellow-500 font-bold text-sm group-hover:translate-x-1 transition-transform">
                  Verificar →
                </div>
              </motion.div>
            )}

            {!currentUser.phoneVerified && (
              <div className="w-full max-w-md transform hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-[#6e0ad6]/20 blur-3xl rounded-full -z-10"></div>
                <PhoneVerification onPhoneVerified={onPhoneVerified} />
              </div>
            )}
          </div>

          {/* 5. MIS ANUNCIOS (Grid Layout) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-[#6e0ad6] min-h-[400px]">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-3 h-8 bg-[#6e0ad6] rounded-full shadow-[0_0_15px_rgba(110,10,214,0.5)]" />
              Mis Publicaciones
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {userAds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userAds.map(ad => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      seller={currentUser}
                      onSelect={() => setSelectedAd(ad)}
                      currentUser={currentUser}
                      onToggleFavorite={() => { }} // No-op for own ads
                      variant="dashboard"
                      onHighlight={handleHighlight}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
                  <div className="p-6 bg-gray-50 rounded-full mb-4">
                    <EyeIcon className="w-12 h-12 text-gray-300" />
                  </div>
                  <p className="font-bold text-lg">No tienes anuncios activos</p>

                  {/* Conditional Link: Only show if verified */}
                  {currentUser.phoneVerified && (
                    <button onClick={() => navigate('/publicar')} className="mt-4 text-[#6e0ad6] font-bold hover:underline">
                      Crear uno ahora
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 6. MIS CHATS (Scrollable List) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 min-h-[400px]">
            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-3 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              Mensajes Recientes
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {userChats.length > 0 ? (
                userChats.map((chat, index) => {
                  const otherUser = getOtherParticipant(chat);
                  if (!otherUser) return null;
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, backgroundColor: '#f8f9fa' }}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => {
                        const otherId = chat.participantIds.find(id => id !== currentUser.id);
                        if (otherId && onOpenChat) onOpenChat(otherId);
                      }}
                    >
                      <div className="relative">
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.name}
                          className="w-14 h-14 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-[#6e0ad6] transition-colors">{otherUser.name}</h4>
                        <p className="text-sm text-gray-500 truncate font-medium">Haz clic para abrir chat</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-full text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
                        <MessageIcon className="w-5 h-5" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
                  <div className="p-6 bg-gray-50 rounded-full mb-4">
                    <MessageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                  <p className="font-bold text-lg">No hay conversaciones</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-3xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Media Section */}
              <div className="flex-1 bg-black relative flex flex-col justify-center group">
                <div ref={mediaContainerRef} className="relative w-full h-full min-h-[300px] md:min-h-[500px] flex items-center justify-center bg-gray-900">
                  {selectedAd.media[selectedMediaIndex]?.type === 'image' ? (
                    <img
                      src={selectedAd.media[selectedMediaIndex]?.url}
                      alt="Detail"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={selectedAd.media[selectedMediaIndex]?.url}
                      controls
                      className="max-w-full max-h-full"
                    />
                  )}
                </div>

                {/* Controls */}
                {selectedAd.media.length > 1 && (
                  <>
                    <button onClick={goPrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">‹</button>
                    <button onClick={goNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">›</button>
                  </>
                )}
              </div>

              {/* Info Section */}
              <div className="w-full md:w-[400px] p-8 bg-surface/95 backdrop-blur-xl border-l border-white/5 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-white leading-tight">{selectedAd.title}</h2>
                  <button onClick={closeLightbox} className="text-gray-500 hover:text-white">✕</button>
                </div>

                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-6">
                  ${selectedAd.price.toLocaleString()}
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</h4>
                    <p className="text-gray-300 leading-relaxed text-sm">{selectedAd.description}</p>
                  </div>

                  {selectedAd.details && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Detalles</h4>
                      <p className="text-gray-400 text-sm">{selectedAd.details}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-2"><EyeIcon className="w-4 h-4" /> {selectedAd.views} Vistas</span>
                  <span>{selectedAd.location}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HIGHLIGHT AD MODAL */}
      <AnimatePresence>
        {highlightAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setHighlightAd(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#6e0ad6] p-6 flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">Destacar Anuncio</h2>
                <button onClick={() => setHighlightAd(null)} className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-8">
                {/* Ad Info */}
                <div className="mb-6">
                  {/* ID Box */}
                  <div className="p-4 bg-[#6e0ad6] rounded-xl shadow-md mb-3">
                    <p className="text-xs text-white font-bold uppercase tracking-wide mb-1">ID del Anuncio</p>
                    <p className="text-lg font-mono font-bold text-white break-all">
                      #{highlightAd.uniqueCode || `AD-${highlightAd.id}`}
                    </p>
                  </div>

                  {/* Title Outside */}
                  <h3 className="text-xl font-black text-black leading-tight">
                    {highlightAd.title}
                  </h3>
                </div>

                {/* Duration Dropdown */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuánto tiempo quieres destacar?</label>
                  <div className="relative">
                    <select
                      value={highlightDuration}
                      onChange={(e) => setHighlightDuration(e.target.value)}
                      className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-800 font-bold rounded-xl py-3 px-4 pr-8 leading-tight focus:outline-none focus:border-[#6e0ad6] focus:ring-0 transition-colors"
                    >
                      <option value="1">1 día = $2.00</option>
                      <option value="3">3 días = $5.00</option>
                      <option value="7">7 días = $8.00</option>
                      <option value="15">15 días = $12.00</option>
                      <option value="30">30 días = $15.00</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="mb-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${highlightTermsAccepted ? 'bg-[#6e0ad6] border-[#6e0ad6]' : 'border-gray-300 group-hover:border-[#6e0ad6]'}`}>
                      {highlightTermsAccepted && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={highlightTermsAccepted}
                      onChange={(e) => setHighlightTermsAccepted(e.target.checked)}
                    />
                    <span className="text-sm text-gray-600 font-medium select-none">
                      Acepto las <span className="text-[#6e0ad6] hover:underline">condiciones de uso</span> y la <span className="text-[#6e0ad6] hover:underline">política de privacidad</span>.
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      disabled={!highlightTermsAccepted}
                      createOrder={(data, actions) => {
                        let value = "2.00";
                        if (highlightDuration === "3") value = "5.00";
                        if (highlightDuration === "7") value = "8.00";
                        if (highlightDuration === "15") value = "12.00";
                        if (highlightDuration === "30") value = "15.00";

                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              amount: {
                                currency_code: "USD",
                                value: value,
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (!actions.order) return;
                        return actions.order.capture().then(async (details) => {
                          // Call backend to feature the ad
                          try {
                            const res = await fetch(`/api/ads/${highlightAd.id}/feature`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ durationDays: highlightDuration })
                            });

                            if (res.ok) {
                              alert("¡Pago exitoso! Tu anuncio ha sido destacado.");
                              setHighlightAd(null);
                              window.location.reload(); // Reload to see changes
                            } else {
                              alert("Error al actualizar el anuncio. Por favor contacta soporte.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Error de conexión.");
                          }
                        });
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMAIL VERIFICATION MODAL */}
      <AnimatePresence>
        {showEmailVerifyModal && (
          <EmailVerificationModal
            currentUser={currentUser}
            onEmailVerified={onEmailVerified}
            onClose={() => setShowEmailVerifyModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;