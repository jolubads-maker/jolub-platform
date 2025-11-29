import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/api.config';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
    if (socket && socket.connected) return socket;

    const socketUrl = getSocketUrl();
    socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        auth: {
            token
        }
    });

    socket.on('connect', () => {
        console.log('✅ Socket conectado globalmente:', socket?.id);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket desconectado globalmente');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
