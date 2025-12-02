import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

import ChangePasswordModal from './ChangePasswordModal';

const AdminLayout: React.FC = () => {
    const { currentUser: user, logout, isCheckingSession, loading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPasswordModal, setShowPasswordModal] = React.useState(false);

    // Protect route
    React.useEffect(() => {
        if (!isCheckingSession && !loading) {
            if (!user || user.role !== 'ADMIN') {
                navigate('/');
            }
        }
    }, [user, isCheckingSession, loading, navigate]);

    if (isCheckingSession || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6e0ad6]"></div>
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return null;
    }

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { label: 'Usuarios', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Anuncios', path: '/admin/ads', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    ];

    return (
        <div className="flex h-screen bg-[#6e0ad6] font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white/10 backdrop-blur-lg text-white flex flex-col shadow-2xl border-r border-white/10">
                <div className="p-6 border-b border-white/10 flex items-center justify-center gap-1">
                    {/* LOGO IDENTICAL TO HEADER */}
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ea580c] to-orange-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                        <span className="text-white font-black text-lg">J</span>
                    </div>
                    <span className="text-white font-black text-lg tracking-tight mx-1">OLU</span>
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ea580c] to-orange-600 rounded-lg flex items-center justify-center shadow-lg transform -rotate-3">
                        <span className="text-white font-black text-lg">B</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-white text-[#6e0ad6] shadow-lg'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-[#6e0ad6]' : 'text-white/70 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2 bg-black/20">
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors group"
                    >
                        <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span className="font-medium">Cambiar Contraseña</span>
                    </button>

                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-xl transition-colors group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#6e0ad6] p-8">
                <Outlet />
            </main>

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    );
};

export default AdminLayout;
