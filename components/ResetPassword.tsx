import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const doPasswordsMatch = password === confirmPassword;
    const showMismatchWarning = confirmPassword.length > 0 && !doPasswordsMatch;
    const isFormValid = doPasswordsMatch && password.length >= 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!doPasswordsMatch) {
            return;
        }

        if (!token) {
            setErrorMessage('Token inválido o expirado');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            if (res.ok) {
                alert('¡Contraseña actualizada con éxito!');
                navigate('/login');
            } else {
                const data = await res.json();
                setErrorMessage(data.error || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#6e0ad6] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Enlace Inválido</h2>
                    <p className="text-gray-600 mb-6">El enlace para restablecer la contraseña no es válido o ha expirado.</p>
                    <button onClick={() => navigate('/login')} className="text-[#6e0ad6] font-bold hover:underline">
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#6e0ad6] flex flex-col items-center justify-center p-4">
            {/* Logo JOLUB */}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
            >
                <h2 className="text-3xl font-black text-center text-[#6e0ad6] mb-8">Nueva Contraseña</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nueva Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6e0ad6] transition-colors text-black font-bold"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirmar Contraseña</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-black font-bold ${showMismatchWarning ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#6e0ad6]'
                                }`}
                            placeholder="••••••••"
                            minLength={6}
                        />
                        {showMismatchWarning && (
                            <p className="text-red-500 text-sm mt-1 font-bold">Las contraseñas no coinciden</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        className="w-full bg-[#f28000] hover:bg-[#d97200] text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </button>

                    {errorMessage && (
                        <p className="text-red-500 text-center font-bold mt-2 animate-pulse">
                            {errorMessage}
                        </p>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
