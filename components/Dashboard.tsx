import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Ad, ChatLog } from '../types';
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
  onOpenChat?: (otherUserId: number) => void;
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
      const res = await fetch('/api/send-code', {
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

      setSuccess('Código enviado por SMS');
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
      const res = await fetch('/api/verify-code', {
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
      className="bg-surface/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-auto"
    >
      <div className="flex items-center mb-4">
        <div className="p-2 bg-yellow-500/20 rounded-xl mr-3 border border-yellow-500/30">
          <LockIcon className="w-5 h-5 text-yellow-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Verificación por SMS</h2>
      </div>

      {/* Mensajes de estado */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 text-sm font-medium">{success}</p>
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
              className="w-24 bg-gray-900/50 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              required
            />
            <input
              type="text"
              placeholder="Número de teléfono"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-gray-900/50 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20"
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
            className="w-full bg-gray-900/50 border border-white/10 text-white rounded-xl p-3 text-center tracking-[0.5em] text-xl font-mono focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-500/20"
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
            className="w-full text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Cambiar número
          </button>
        </form>
      )}
    </motion.div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ currentUser, userAds, userChats, users, onPhoneVerified, onOpenChat }) => {

  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const closeLightbox = () => {
    setSelectedAd(null);
    setSelectedMediaIndex(0);
  };

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

  return (
    <div className="min-h-screen bg-background text-gray-100 p-4 md:p-8">

      {/* BENTO GRID LAYOUT */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

        {/* 1. PERFIL (Featured Tile - 2x2) */}
        <motion.div
          layoutId="profile-card"
          className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-surface/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors duration-700" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50" />
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="relative w-24 h-24 rounded-full border-2 border-white/20 object-cover shadow-2xl"
                />
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-surface ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400 mb-2">
                  ID: {currentUser.uniqueId || `USER-${currentUser.id}`}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-4xl font-black text-white mb-1 tracking-tight">{currentUser.name}</h1>
              <p className="text-gray-400 text-lg">Bienvenido a tu centro de control</p>
            </div>

            <div className="mt-8 flex gap-4">
              {!currentUser.phoneVerified && (
                <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                  <LockIcon className="w-4 h-4" />
                  <span className="text-sm font-bold">Verificación Pendiente</span>
                </div>
              )}
              {currentUser.phoneVerified && (
                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                  <LockIcon className="w-4 h-4" />
                  <span className="text-sm font-bold">Verificado</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 2. STATS: PUNTOS */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-surface/30 backdrop-blur-md border border-yellow-500/20 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
              <StarIcon className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-300">Reputación</span>
          </div>
          <div>
            <div className="text-4xl font-black text-white mb-1">{currentUser.points}</div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${Math.min((currentUser.points / 1000) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Puntos de confianza</p>
          </div>
        </motion.div>

        {/* 3. STATS: ANUNCIOS */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-surface/30 backdrop-blur-md border border-blue-500/20 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <EyeIcon className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-300">Anuncios</span>
          </div>
          <div>
            <div className="text-4xl font-black text-white mb-1">{userAds.length}</div>
            <p className="text-xs text-gray-500 mt-1">Activos en el mercado</p>
          </div>
        </motion.div>

        {/* 4. VERIFICACIÓN TELEFÓNICA (Si es necesaria) */}
        {!currentUser.phoneVerified && (
          <div className="col-span-1 md:col-span-3 lg:col-span-4">
            <PhoneVerification onPhoneVerified={onPhoneVerified} />
          </div>
        )}

        {/* 5. MIS ANUNCIOS (Scrollable List) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-surface/30 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full" />
            Mis Publicaciones
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {userAds.length > 0 ? (
              userAds.map(ad => (
                <motion.div
                  key={ad.id}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedAd(ad)}
                >
                  <img
                    src={ad.media[0].url}
                    alt={ad.title}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-200 truncate">{ad.title}</h4>
                    <p className="text-primary font-bold">${ad.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> {ad.views}</span>
                    </div>
                  </div>
                  <div className="text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                <EyeIcon className="w-12 h-12 mb-2" />
                <p>No tienes anuncios activos</p>
              </div>
            )}
          </div>
        </div>

        {/* 6. MIS CHATS (Scrollable List) */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2 row-span-2 bg-surface/30 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-green-500 rounded-full" />
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
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer transition-colors"
                    onClick={() => {
                      const otherId = chat.participantIds.find(id => id !== currentUser.id);
                      if (otherId && onOpenChat) onOpenChat(otherId);
                    }}
                  >
                    <div className="relative">
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${otherUser.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-200 truncate">{otherUser.name}</h4>
                      <p className="text-xs text-gray-500 truncate">Haz clic para abrir chat</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                      <MessageIcon className="w-4 h-4" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                <MessageIcon className="w-12 h-12 mb-2" />
                <p>No hay conversaciones</p>
              </div>
            )}
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
    </div>
  );
};

export default Dashboard;