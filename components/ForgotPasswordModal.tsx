import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const { resetPassword, loading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Ingresa un correo válido');
            return;
        }

        setError('');

        try {
            await resetPassword(email);
            setIsSent(true);
        } catch (err: any) {
            setError(err.message || 'Error al enviar el correo');
        }
    };

    const isValidEmail = email.includes('@') && email.includes('.');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-[#6e0ad6]">Recuperar Contraseña</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {isSent ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">¡Correo Enviado!</h3>
                                <p className="text-gray-600 mb-6">
                                    Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>.
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Revisa tu bandeja de entrada y spam. El enlace expira en 1 hora.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="bg-[#6e0ad6] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5b08b0] transition-colors w-full"
                                >
                                    Entendido
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <p className="text-gray-600 mb-4">
                                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                                </p>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-black font-medium ${error ? 'border-red-500 focus:border-red-500' :
                                            isValidEmail ? 'border-green-500 focus:border-green-500' :
                                                'border-gray-200 focus:border-[#6e0ad6]'
                                            }`}
                                        placeholder="ejemplo@correo.com"
                                    />
                                    {error && <p className="text-red-500 text-sm mt-1 font-bold">{error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !isValidEmail}
                                    className="w-full bg-[#6e0ad6] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5b08b0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar Enlace'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ForgotPasswordModal;

