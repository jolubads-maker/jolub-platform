import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ForgotPasswordModalProps {
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [emailExists, setEmailExists] = useState(false);
    const [emailError, setEmailError] = useState('');

    React.useEffect(() => {
        const checkEmail = async () => {
            if (!email || !email.includes('@')) {
                setEmailExists(false);
                setEmailError('');
                return;
            }

            setIsValidating(true);
            setEmailError('');

            try {
                const res = await fetch('/api/auth/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (data.exists) {
                    setEmailExists(true);
                    setEmailError('');
                } else {
                    setEmailExists(false);
                    setEmailError('Este correo no está registrado.');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsValidating(false);
            }
        };

        const timeoutId = setTimeout(checkEmail, 500);
        return () => clearTimeout(timeoutId);
    }, [email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailExists) return;

        setIsLoading(true);

        try {
            // Llamada al backend
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setIsSent(true);
            } else {
                const data = await res.json();
                alert(data.error || 'Error al enviar el correo');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-black font-medium ${emailError ? 'border-red-500 focus:border-red-500' :
                                            emailExists ? 'border-green-500 focus:border-green-500' :
                                                'border-gray-200 focus:border-[#6e0ad6]'
                                        }`}
                                    placeholder="ejemplo@correo.com"
                                />
                                {emailError && <p className="text-red-500 text-sm mt-1 font-bold">{emailError}</p>}
                                {isValidating && <p className="text-gray-500 text-sm mt-1">Verificando...</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !emailExists || isValidating}
                                className="w-full bg-[#6e0ad6] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5b08b0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando...
                                    </>
                                ) : isValidating ? (
                                    'Verificando correo...'
                                ) : (
                                    'Enviar Enlace'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordModal;
