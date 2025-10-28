import React, { useState } from 'react';
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
        <div className="bg-gray-800/70 border border-gray-700/70 rounded-xl p-4 sm:p-5 shadow-xl max-w-md w-full mx-auto">
            <div className="flex items-center mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg mr-2">
                    <LockIcon className="w-5 h-5 text-yellow-400"/>
                </div>
                <h2 className="text-lg font-semibold text-white">Verificación por SMS</h2>
            </div>

            {/* Mensajes de estado */}
            {error && (
                <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}

            {step === 'enterPhone' && (
                <form onSubmit={handleSendCode} className="space-y-3">
                    <div className="flex gap-2">
                    <input 
                      type="text" 
                            placeholder="Código país (ej. 52)" 
                      value={countryCode} 
                      onChange={e => setCountryCode(e.target.value)} 
                            className="w-28 bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                    <input 
                      type="text" 
                            placeholder="Número" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                        {loading ? 'Enviando…' : 'Enviar código'}
                    </button>
                </form>
            )}

            {step === 'enterCode' && (
                <form onSubmit={handleVerifyCode} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Código de 6 dígitos" 
                      value={code} 
                      onChange={e => setCode(e.target.value)} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 text-center tracking-widest focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                        {loading ? 'Verificando…' : 'Verificar'}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => {
                            setStep('enterPhone');
                            setError('');
                            setSuccess('');
                        }}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2 px-4 rounded-lg transition"
                    >
                        Cambiar número
                    </button>
                </form>
            )}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ currentUser, userAds, userChats, users, onPhoneVerified, onOpenChat }) => {

  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  const mediaContainerRef = React.useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-jolub-blue to-jolub-dark">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* User Profile */}
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="relative w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl"
                />
                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-lg ${
                  currentUser.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
          </div>
          <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  {currentUser.name}
                </h1>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-mono text-blue-200 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-400/30">
                    ID: {currentUser.uniqueId || `USER-${currentUser.id}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser.uniqueId || `USER-${currentUser.id}`);
                      alert('ID copiado al portapapeles!');
                    }}
                    className="text-blue-300 hover:text-blue-100 transition-colors"
                    title="Copiar ID"
                  >
                    📋
                  </button>
                </div>
                <p className="text-xl text-gray-300 mb-2">Bienvenido a tu panel de control</p>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${currentUser.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
              {currentUser.isOnline ? '🟢 En línea' : '⚫ Desconectado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-400">{userAds.length}</div>
                <div className="text-sm text-gray-300">Anuncios</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400">{userChats.length}</div>
                <div className="text-sm text-gray-300">Chats</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400">{currentUser.points}</div>
                <div className="text-sm text-gray-300">Puntos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {!currentUser.phoneVerified && (
          <div className="mb-8">
            <PhoneVerification onPhoneVerified={onPhoneVerified} />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Points & Stats */}
          <div className="xl:col-span-1 space-y-6">
            {/* Points Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-red-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                      <StarIcon className="w-6 h-6 text-white"/>
                    </div>
                    <h2 className="text-xl font-bold text-white">Puntos de Reputación</h2>
                  </div>
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  {currentUser.points.toLocaleString()}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Gana puntos con ventas exitosas y buenas reseñas de la comunidad.
                </p>
                <div className="mt-6 bg-gray-800/50 rounded-xl p-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Progreso al siguiente nivel</span>
                    <span>{currentUser.points} / 1000</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((currentUser.points / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Publicar Nuevo Anuncio
                </button>
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Ver Todos los Chats
                </button>
              </div>
            </div>
      </div>

          {/* Right Column - Ads & Chats */}
          <div className="xl:col-span-2 space-y-6">
      {/* My Ads */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                      <EyeIcon className="w-5 h-5 text-white"/>
                    </div>
                    <h2 className="text-xl font-bold text-white">Mis Anuncios Publicados</h2>
                  </div>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {userAds.length} anuncios
                  </span>
                </div>
              </div>
              <div className="p-6">
                {userAds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userAds.map(ad => (
                      <div key={ad.id} className="group bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={ad.media[0].url} 
                            alt={ad.title} 
                            className="w-16 h-16 object-cover rounded-lg shadow-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                              {ad.title}
                            </h3>
                            <p className="text-lg font-bold text-green-400 mt-1">
                              ${ad.price.toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                              <span className="flex items-center space-x-1">
                                <EyeIcon className="w-4 h-4"/>
                                <span>{ad.views}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <button
                              onClick={() => setSelectedAd(ad)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                            >
                              Ver
                            </button>
                          </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <EyeIcon className="w-8 h-8 text-gray-400"/>
                    </div>
                    <p className="text-gray-400 text-lg">Aún no has publicado ningún anuncio</p>
                    <p className="text-gray-500 text-sm mt-2">¡Comienza vendiendo tus productos!</p>
                  </div>
                )}
              </div>
      </div>

      {/* My Chats */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <MessageIcon className="w-5 h-5 text-white"/>
                    </div>
                    <h2 className="text-xl font-bold text-white">Mis Conversaciones</h2>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                    {userChats.length} chats activos
                  </span>
                </div>
              </div>
              <div className="p-6">
                {userChats.length > 0 ? (
                  <div className="space-y-4">
                    {userChats.map((chat, index) => {
                      const otherUser = getOtherParticipant(chat);
                      return otherUser ? (
                        <div key={index} className="group bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl p-4 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <img 
                                  src={otherUser.avatar} 
                                  alt={otherUser.name} 
                                  className="w-12 h-12 rounded-full border-2 border-gray-600/50"
                                />
                                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${
                                  otherUser.isOnline ? 'bg-green-500' : 'bg-gray-500'
                                }`}></div>
                              </div>
                              <div>
                                <p className="font-semibold text-white group-hover:text-green-400 transition-colors duration-300">
                                  Chat con {otherUser.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {otherUser.isOnline ? '🟢 En línea' : '⚫ Desconectado'}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const otherId = (chat.participantIds.find(id => id !== currentUser.id)) as number;
                                onOpenChat && onOpenChat(otherId);
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              Abrir Chat
                            </button>
                          </div>
                </div>
              ) : null;
            })}
          </div>
        ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageIcon className="w-8 h-8 text-gray-400"/>
                    </div>
                    <p className="text-gray-400 text-lg">No tienes conversaciones activas</p>
                    <p className="text-gray-500 text-sm mt-2">¡Comienza a chatear con otros usuarios!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Lightbox del anuncio */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={closeLightbox}></div>
          {/* Modal */}
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-6xl w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%] 2xl:w-[70%] max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">{selectedAd.title}</h3>
              <button
                onClick={closeLightbox}
                className="text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1"
              >
                Cerrar
              </button>
            </div>
            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Media Carousel */}
              <div className="bg-gray-800/50 p-0 lg:p-4 flex flex-col">
                <div ref={mediaContainerRef} className="relative bg-black/40 flex items-center justify-center overflow-hidden rounded-none lg:rounded-lg border border-gray-700 aspect-square w-full max-w-[1084px] max-h-[1084px] mx-auto">
                  {selectedAd.media[selectedMediaIndex]?.type === 'image' ? (
                    <img 
                      src={selectedAd.media[selectedMediaIndex]?.url}
                      alt={`media-${selectedMediaIndex}`}
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={requestFullscreen}
                    />
                  ) : (
                    <video 
                      src={selectedAd.media[selectedMediaIndex]?.url} 
                      controls 
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={(e) => { e.preventDefault(); requestFullscreen(); }}
                    />
                  )}

                  {/* Prev/Next Controls */}
                  <button 
                    onClick={goPrevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900/70 hover:bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/10"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={goNextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900/70 hover:bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/10"
                    aria-label="Siguiente"
                  >
                    ›
                  </button>
                </div>

                {/* Thumbnails */}
                {selectedAd.media.length > 1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2 p-3 lg:p-0">
                    {selectedAd.media.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMediaIndex(idx)}
                        className={`relative border ${idx === selectedMediaIndex ? 'border-blue-500' : 'border-gray-700'} rounded-lg overflow-hidden h-16 bg-gray-900`}
                        aria-label={`Seleccionar media ${idx + 1}`}
                      >
                        {m.type === 'image' ? (
                          <img src={m.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Video</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Details */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] lg:max-h-[75vh]">
                <div>
                  <p className="text-3xl font-extrabold text-green-400">${selectedAd.price.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Descripción</h4>
                  <p className="text-gray-300 leading-relaxed">{selectedAd.description}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <EyeIcon className="w-5 h-5"/>
                  <span>{selectedAd.views} visualizaciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;