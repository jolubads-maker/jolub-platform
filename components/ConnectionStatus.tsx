import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSocket } from '../services/socketService';

const ConnectionStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check socket status periodically
        const checkSocket = () => {
            const socket = getSocket();
            setIsSocketConnected(socket?.connected || false);
        };

        const interval = setInterval(checkSocket, 2000);
        checkSocket();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const location = useLocation();

    useEffect(() => {
        // Show only if there's a problem AND we are not in admin
        if ((!isOnline || !isSocketConnected) && !location.pathname.startsWith('/admin')) {
            setShow(true);
        } else {
            // Hide after a delay when everything is fine
            const timer = setTimeout(() => setShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, isSocketConnected, location.pathname]);

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
            {!isOnline && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span className="font-bold text-sm">Sin conexión a Internet</span>
                </div>
            )}

            {isOnline && !isSocketConnected && (
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="font-bold text-sm">Reconectando chat...</span>
                </div>
            )}

            {isOnline && isSocketConnected && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-out">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-sm">Conexión restaurada</span>
                </div>
            )}
        </div>
    );
};

export default ConnectionStatus;
