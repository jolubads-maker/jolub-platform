import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

interface Transaction {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    plan: string;
    planName: string;
    amount: number;
    currency: string;
    provider: 'stripe' | 'paypal';
    status: string;
    subscriptionExpiresAt: Timestamp;
    createdAt: Timestamp;
    stripeSessionId?: string;
    paypalOrderId?: string;
}

const SalesDashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch transactions with real-time updates
    useEffect(() => {
        const q = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs: Transaction[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Transaction));
            setTransactions(txs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTransactions = transactions.filter(tx => {
            if (!tx.createdAt) return false;
            const txDate = tx.createdAt.toDate();
            txDate.setHours(0, 0, 0, 0);
            return txDate.getTime() === today.getTime();
        });

        const todayTotal = todayTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

        // Plan breakdown
        const planCounts: Record<string, number> = {};
        todayTransactions.forEach(tx => {
            planCounts[tx.plan] = (planCounts[tx.plan] || 0) + 1;
        });

        // Provider breakdown
        const providerCounts: Record<string, number> = {};
        const providerTotals: Record<string, number> = {};
        transactions.forEach(tx => {
            providerCounts[tx.provider] = (providerCounts[tx.provider] || 0) + 1;
            providerTotals[tx.provider] = (providerTotals[tx.provider] || 0) + (tx.amount || 0);
        });

        // Total revenue
        const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

        return {
            todayTotal,
            todayCount: todayTransactions.length,
            planCounts,
            providerCounts,
            providerTotals,
            totalRevenue,
            totalTransactions: transactions.length,
        };
    }, [transactions]);

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return '-';
        return timestamp.toDate().toLocaleDateString('es-NI', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'basic': return 'bg-blue-500';
            case 'pro': return 'bg-purple-500';
            case 'business': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    };

    const getProviderIcon = (provider: string) => {
        if (provider === 'stripe') {
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#635bff">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#003087">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.641h6.622c2.189 0 3.926.504 5.163 1.5 1.239.996 1.858 2.432 1.858 4.308 0 .996-.168 1.908-.504 2.736-.336.828-.792 1.536-1.368 2.124a5.833 5.833 0 0 1-1.992 1.368c-.756.324-1.572.54-2.448.648a4.533 4.533 0 0 1-.468.024H9.472l-.828 5.326a.77.77 0 0 1-.757.641H7.076z" />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">💰 Panel de Ventas</h1>
                    <p className="text-gray-500 text-sm">Monitorea tus ingresos en tiempo real</p>
                </div>
                <div className="text-right">
                    <span className="text-sm text-gray-500">Última actualización</span>
                    <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ventas Hoy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💵</span>
                        <span className="text-sm font-medium opacity-90">Ventas Hoy</span>
                    </div>
                    <p className="text-3xl font-black">${kpis.todayTotal.toFixed(2)}</p>
                    <p className="text-sm opacity-80 mt-1">{kpis.todayCount} transacciones</p>
                </motion.div>

                {/* Ingresos Totales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💎</span>
                        <span className="text-sm font-medium opacity-90">Ingresos Totales</span>
                    </div>
                    <p className="text-3xl font-black">${kpis.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm opacity-80 mt-1">{kpis.totalTransactions} ventas totales</p>
                </motion.div>

                {/* Planes Vendidos Hoy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📦</span>
                        <span className="text-sm font-medium text-gray-600">Planes Hoy</span>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(kpis.planCounts).length > 0 ? (
                            Object.entries(kpis.planCounts).map(([plan, count]) => (
                                <div key={plan} className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getPlanBadgeColor(plan)}`}>
                                        {plan.toUpperCase()}
                                    </span>
                                    <span className="font-bold text-gray-800">{count}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Sin ventas hoy</p>
                        )}
                    </div>
                </motion.div>

                {/* Por Pasarela */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">💳</span>
                        <span className="text-sm font-medium text-gray-600">Por Pasarela</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getProviderIcon('stripe')}
                                <span className="text-sm text-gray-600">Stripe</span>
                            </div>
                            <span className="font-bold text-gray-800">
                                ${(kpis.providerTotals['stripe'] || 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getProviderIcon('paypal')}
                                <span className="text-sm text-gray-600">PayPal</span>
                            </div>
                            <span className="font-bold text-gray-800">
                                ${(kpis.providerTotals['paypal'] || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transactions Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">📋 Últimas Transacciones</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pasarela</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expira</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No hay transacciones aún
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{tx.userName || 'Usuario'}</p>
                                                <p className="text-xs text-gray-500">{tx.userEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getPlanBadgeColor(tx.plan)}`}>
                                                {tx.planName || tx.plan?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-green-600">${tx.amount?.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getProviderIcon(tx.provider)}
                                                <span className="text-sm text-gray-600 capitalize">{tx.provider}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">{formatDate(tx.createdAt)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">{formatDate(tx.subscriptionExpiresAt)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default SalesDashboard;
