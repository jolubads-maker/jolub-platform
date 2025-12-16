import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuthStore } from '../store/useAuthStore';
import { notify } from '../services/notificationService';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Plan types and limits
export interface SubscriptionPlan {
    id: 'free' | 'basic' | 'pro' | 'business';
    name: string;
    price: number;
    adLimit: number;
    duration: number;
    features: string[];
    popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Gratis',
        price: 0,
        adLimit: 3,
        duration: 7,
        features: [
            '3 anuncios activos',
            '7 días de duración',
            'Auto-eliminación al expirar',
            'Chats eliminados al expirar',
            'Soporte básico'
        ]
    },
    {
        id: 'basic',
        name: 'Básico',
        price: 5,
        adLimit: 15,
        duration: 30,
        features: [
            '15 anuncios activos',
            '30 días de duración',
            'Renovación manual',
            'Historial de chats',
            'Soporte prioritario'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 7,
        adLimit: 30,
        duration: 30,
        popular: true,
        features: [
            '30 anuncios activos',
            '30 días de duración',
            'Anuncios destacados (2)',
            'Estadísticas avanzadas',
            'Soporte prioritario',
            'Badge verificado'
        ]
    },
    {
        id: 'business',
        name: 'Empresas',
        price: 10,
        adLimit: 60,
        duration: 30,
        features: [
            '60 anuncios activos',
            '30 días de duración',
            'Anuncios destacados (5)',
            'Panel empresarial',
            'Soporte VIP 24/7',
            'Badge empresarial',
            'Perfil verificado'
        ]
    }
];

export const getPlanById = (planId: string): SubscriptionPlan => {
    return SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
};

export const getAdLimitForPlan = (planId: string): number => {
    return getPlanById(planId).adLimit;
};

// PayPal Configuration
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

const PricingPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, updateUser } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Stripe Checkout
    const handleStripeCheckout = async (plan: SubscriptionPlan) => {
        if (!currentUser) {
            notify.error('Debes iniciar sesión');
            navigate('/login');
            return;
        }

        setProcessing(true);
        setPaymentMethod('stripe');

        try {
            const functions = getFunctions();
            const createCheckout = httpsCallable(functions, 'createStripeCheckout');

            const result = await createCheckout({
                planId: plan.id,
                userId: currentUser.id || currentUser.uid,
                userEmail: currentUser.email,
                userName: currentUser.name,
            });

            const { url } = result.data as { url: string };

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No se recibió URL de pago');
            }
        } catch (error: any) {
            console.error('Error Stripe:', error);
            notify.error('Error al iniciar pago con Stripe');
            setProcessing(false);
            setPaymentMethod(null);
        }
    };

    // PayPal Payment
    const handlePayPalApprove = async (plan: SubscriptionPlan, orderId: string, payerId: string) => {
        if (!currentUser) return;

        try {
            const functions = getFunctions();
            const registerPayPal = httpsCallable(functions, 'registerPayPalTransaction');

            await registerPayPal({
                planId: plan.id,
                userId: currentUser.id || currentUser.uid,
                userEmail: currentUser.email,
                userName: currentUser.name,
                paypalOrderId: orderId,
                paypalPayerId: payerId,
            });

            // Update local state
            await updateUser({
                subscriptionPlan: plan.id,
                subscriptionExpiry: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
                adLimit: plan.adLimit
            });

            notify.success(`¡Plan ${plan.name} activado exitosamente!`);
            setShowPaymentModal(false);

            setTimeout(() => {
                navigate(`/dashboard/${currentUser.uniqueId || 'USER-' + currentUser.id}`);
            }, 1000);
        } catch (error: any) {
            console.error('Error PayPal:', error);
            notify.error('Error al procesar pago con PayPal');
        }
    };

    const openPaymentModal = (plan: SubscriptionPlan) => {
        if (!currentUser) {
            notify.error('Debes iniciar sesión');
            navigate('/login');
            return;
        }

        if (currentUser.subscriptionPlan === plan.id) {
            notify.info(`Ya tienes el plan ${plan.name}`);
            return;
        }

        if (plan.id === 'free') {
            notify.info('El plan gratuito es automático');
            return;
        }

        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-16 px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-black text-white mb-4">
                        Elige tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Plan</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Desbloquea más anuncios y funciones premium para vender más rápido
                    </p>
                </motion.div>

                {/* Back button */}
                <div className="max-w-7xl mx-auto mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {SUBSCRIPTION_PLANS.map((plan, index) => {
                        const isCurrentPlan = currentUser?.subscriptionPlan === plan.id;
                        const isProcessingThis = processing && selectedPlan?.id === plan.id;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${plan.popular
                                        ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                                        : 'bg-white/10 border-white/20 hover:border-white/40'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                                            ⭐ Más Popular
                                        </span>
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-3 right-4">
                                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                            ✓ Tu Plan
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6 mt-4">
                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-black text-white">${plan.price}</span>
                                        <span className="text-gray-400">/mes</span>
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-xl p-4 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">Anuncios:</span>
                                        <span className="text-white font-bold">{plan.adLimit}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-gray-300">Duración:</span>
                                        <span className="text-white font-bold">{plan.duration} días</span>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => openPaymentModal(plan)}
                                    disabled={isCurrentPlan || processing || plan.id === 'free'}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isCurrentPlan || plan.id === 'free'
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : plan.popular
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105'
                                                : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                >
                                    {isProcessingThis ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Procesando...
                                        </span>
                                    ) : isCurrentPlan ? (
                                        'Plan Actual'
                                    ) : plan.id === 'free' ? (
                                        'Gratis'
                                    ) : (
                                        'Elegir Plan'
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Payment Modal */}
                <AnimatePresence>
                    {showPaymentModal && selectedPlan && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => !processing && setShowPaymentModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-md w-full border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.3)]"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        Plan {selectedPlan.name}
                                    </h3>
                                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                        ${selectedPlan.price}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {selectedPlan.adLimit} anuncios por {selectedPlan.duration} días
                                    </p>
                                </div>

                                {/* Payment Options */}
                                <div className="space-y-4">
                                    {/* Stripe Button */}
                                    <button
                                        onClick={() => handleStripeCheckout(selectedPlan)}
                                        disabled={processing}
                                        className="w-full py-4 bg-[#635bff] hover:bg-[#5147e5] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {processing && paymentMethod === 'stripe' ? (
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                                                </svg>
                                                <span>Pagar con Stripe</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-px bg-gray-700" />
                                        <span className="text-gray-500 text-sm">o</span>
                                        <div className="flex-1 h-px bg-gray-700" />
                                    </div>

                                    {/* PayPal Button */}
                                    <div className="rounded-xl overflow-hidden">
                                        <PayPalButtons
                                            style={{
                                                layout: 'horizontal',
                                                color: 'gold',
                                                shape: 'rect',
                                                label: 'pay',
                                                height: 50,
                                            }}
                                            disabled={processing}
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    intent: 'CAPTURE',
                                                    purchase_units: [{
                                                        amount: {
                                                            currency_code: 'USD',
                                                            value: selectedPlan.price.toString(),
                                                        },
                                                        description: `Plan ${selectedPlan.name} - Jolub Marketplace`,
                                                    }],
                                                });
                                            }}
                                            onApprove={async (data, actions) => {
                                                const order = await actions.order?.capture();
                                                if (order) {
                                                    await handlePayPalApprove(
                                                        selectedPlan,
                                                        order.id,
                                                        data.payerID || ''
                                                    );
                                                }
                                            }}
                                            onError={(err) => {
                                                console.error('PayPal Error:', err);
                                                notify.error('Error al procesar pago con PayPal');
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Cancel Button */}
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={processing}
                                    className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Cancelar
                                </button>

                                {/* Security Note */}
                                <p className="text-center text-gray-500 text-xs mt-4">
                                    🔒 Pagos seguros procesados por Stripe y PayPal
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="max-w-3xl mx-auto mt-20"
                >
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Preguntas Frecuentes</h2>
                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <h3 className="text-white font-bold mb-2">¿Qué pasa cuando expira mi plan?</h3>
                            <p className="text-gray-400 text-sm">Tu cuenta vuelve al plan gratuito. Los anuncios extra serán pausados hasta que renueves.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <h3 className="text-white font-bold mb-2">¿Puedo cambiar de plan?</h3>
                            <p className="text-gray-400 text-sm">Sí, puedes mejorar o cambiar tu plan en cualquier momento. Se aplicará de inmediato.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <h3 className="text-white font-bold mb-2">¿Métodos de pago aceptados?</h3>
                            <p className="text-gray-400 text-sm">Aceptamos tarjetas de crédito/débito vía Stripe y también PayPal.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PayPalScriptProvider>
    );
};

export default PricingPage;
