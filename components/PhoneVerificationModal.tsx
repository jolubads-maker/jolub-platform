import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhoneVerificationModalProps {
    onPhoneVerified: (phoneNumber: string) => void;
    onClose: () => void;
}

const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({ onPhoneVerified, onClose }) => {
    const [step, setStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
    const [countryCode, setCountryCode] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const buildE164 = () => `+${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

    useEffect(() => {
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

            if (data.mock) {
                setSuccess(`MODO DEMO: El código es ${data.code} (Configura TWILIO en el backend para envío real)`);
            } else {
                setSuccess(`Código enviado por SMS a ${phoneNumber}`);
            }
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
            localStorage.removeItem('phoneVerification');
            setTimeout(() => {
                onPhoneVerified(buildE164());
                onClose();
            }, 1000);

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
                            📱
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 text-center">Verificación de Teléfono</h2>
                        <p className="text-gray-500 text-center text-sm mt-2">
                            {step === 'enterPhone' ? 'Ingresa tu número para recibir un código SMS.' : `Ingresa el código enviado a ${buildE164()}`}
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

                    {step === 'enterPhone' && (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="52"
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value)}
                                    className="w-24 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl p-3 focus:ring-2 focus:ring-[#6e0ad6]/50 focus:border-[#6e0ad6] transition-all outline-none text-center font-bold"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Número de teléfono"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl p-3 focus:ring-2 focus:ring-[#6e0ad6]/50 focus:border-[#6e0ad6] transition-all outline-none font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#6e0ad6] hover:bg-[#5b00b3] disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#6e0ad6]/30 transform hover:-translate-y-1"
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
                                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-[#6e0ad6] text-gray-800 placeholder-gray-300 rounded-xl p-4 text-center tracking-[0.5em] text-2xl font-black outline-none transition-colors uppercase"
                                required
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30 transform hover:-translate-y-1"
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

export default PhoneVerificationModal;
