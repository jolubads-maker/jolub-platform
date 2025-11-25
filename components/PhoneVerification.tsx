import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhoneVerificationProps {
    onPhoneVerified: (phoneNumber: string) => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onPhoneVerified }) => {
    const [step, setStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
    const [countryCode, setCountryCode] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const buildE164 = () => `+${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

    // Cargar datos guardados al montar el componente
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

export default PhoneVerification;
