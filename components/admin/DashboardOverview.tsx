// Admin Dashboard Overview - Firebase Version
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

interface Stats {
    totalUsers: number;
    activeAds: number;
    expiredAds: number;
    totalRevenue: number;
    newUsers: number;
}

interface RevenueData {
    name: string;
    value: number;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: any;
    avatar: string;
}

const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch users
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const users = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as User[];

                // Fetch ads
                const adsRef = collection(db, 'ads');
                const adsSnapshot = await getDocs(adsRef);
                const adsCount = adsSnapshot.size;

                // Calculate stats
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const newUsersCount = users.filter(u => {
                    const createdAt = u.createdAt?.toDate?.() || new Date(u.createdAt);
                    return createdAt > thirtyDaysAgo;
                }).length;

                setStats({
                    totalUsers: users.length,
                    activeAds: adsCount,
                    expiredAds: 0, // Firebase doesn't track expiration the same way
                    totalRevenue: 0, // Would need transactions collection
                    newUsers: newUsersCount
                });

                // Mock revenue data for chart
                setRevenueData([
                    { name: 'Ene', value: 0 },
                    { name: 'Feb', value: 0 },
                    { name: 'Mar', value: 0 },
                    { name: 'Abr', value: 0 },
                    { name: 'May', value: 0 },
                    { name: 'Jun', value: 0 },
                ]);

                // Recent users (last 5)
                setRecentUsers(users.slice(0, 5));

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-display font-bold text-white">Panel General</h2>
                <div className="text-sm text-white/80">
                    Última actualización: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Total Usuarios</h3>
                        <div className="p-2 bg-purple-100 rounded-xl">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                    <span className="text-sm text-gray-400">Usuarios registrados</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Anuncios Activos</h3>
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats?.activeAds || 0}</p>
                    <span className="text-sm text-gray-400">En la plataforma</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Ingresos Totales</h3>
                        <div className="p-2 bg-green-100 rounded-xl">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">${stats?.totalRevenue?.toLocaleString() || 0}</p>
                    <span className="text-sm text-gray-400">PayPal conectado</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Usuarios Nuevos</h3>
                        <div className="p-2 bg-orange-100 rounded-xl">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats?.newUsers || 0}</p>
                    <span className="text-sm text-orange-500 font-medium">Últimos 30 días</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-white/20">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Evolución de Usuarios</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6e0ad6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6e0ad6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6e0ad6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ads Status Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Estado de Anuncios</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Activos', value: stats?.activeAds || 0 },
                                { name: 'Vencidos', value: stats?.expiredAds || 0 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#ea580c" radius={[8, 8, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Usuarios Recientes</h3>
                </div>
                <div className="space-y-4">
                    {recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6e0ad6&color=fff`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{user.name}</h4>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <span className="text-xs text-gray-400">
                                {user.createdAt?.toDate ? format(user.createdAt.toDate(), 'dd MMM', { locale: es }) : '-'}
                            </span>
                        </div>
                    ))}
                    {recentUsers.length === 0 && (
                        <p className="text-center text-gray-400 py-4">No hay usuarios registrados aún</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
