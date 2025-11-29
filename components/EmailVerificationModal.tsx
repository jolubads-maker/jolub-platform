import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../src/types';

interface EmailVerificationModalProps {
    currentUser: User;
    onEmailVerified: () => void;
    onClose: () => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ currentUser, onEmailVerified, onClose }) => {
    const [step, setStep] = useState<'initial' | 'enterCode'>('initial');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Sync email with currentUser when it loads
    React.useEffect(() => {
        if (currentUser?.email) {
            setEmail(currentUser.email);
        }
    }, [currentUser]);

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

export default EmailVerificationModal;
