import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../src/types';
import { useAuthStore } from '../../store/useAuthStore';
import { storageService } from '../../services/storageService';
import { userService } from '../../services/firebaseService';

interface DashboardProfileProps {
    currentUser: User;
}

const DashboardProfile: React.FC<DashboardProfileProps> = ({ currentUser }) => {
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showEmail, setShowEmail] = useState(currentUser.showEmail || false);
    const [showPhone, setShowPhone] = useState(currentUser.showPhone || false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            // Upload to Firebase Storage
            const newAvatarUrl = await storageService.uploadImage(file, 'avatars');

            // Update user in Firestore
            const uid = String(currentUser.providerId || currentUser.uid || currentUser.id);
            await userService.updateUser(uid, { avatar: newAvatarUrl });

            // Update local state
            useAuthStore.setState(state => ({
                currentUser: { ...state.currentUser!, avatar: newAvatarUrl }
            }));

            alert('Avatar actualizado correctamente');
        } catch (error: any) {
            console.error('Error actualizando avatar:', error);
            alert(`Error: ${error.message || 'No se pudo actualizar la imagen'}`);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const toggleEmailVisibility = () => {
        setShowEmail(!showEmail);
        // TODO: Persist to Firestore if needed
    };

    const togglePhoneVisibility = () => {
        setShowPhone(!showPhone);
        // TODO: Persist to Firestore if needed
    };

    return (
        <motion.div
            layoutId="profile-card"
            className="col-span-1 md:col-span-2 bg-[#6e0ad6] rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl min-h-[200px] flex flex-col justify-center"
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 pl-4">

                {/* Avatar (Left) */}
                <div className="relative group/avatar cursor-pointer flex-shrink-0" onClick={handleAvatarClick}>
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-50 group-hover/avatar:opacity-80 transition-opacity" />
                    <img
                        src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name) + "&background=random"}
                        alt={currentUser.name}
                        className="relative w-32 h-32 rounded-full border-4 border-white/20 object-cover shadow-2xl transition-transform duration-300 group-hover/avatar:scale-105 bg-gray-800"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name) + "&background=random";
                        }}
                    />
                    {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 rounded-full">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#1a1a1a] rounded-full flex items-center justify-center z-20 border-2 border-[#6e0ad6]">
                        <div className={`w-3 h-3 rounded-full ${currentUser.isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-[#363636]'}`} />
                    </div>
                </div>

                {/* Info (Middle) */}
                <div className="flex flex-col items-center md:items-start gap-1 flex-1 pt-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md mb-0.5">{currentUser.name}</h1>
                    <p className="text-white/80 text-sm font-medium mb-4">
                        Miembro desde {new Date(currentUser.createdAt || Date.now()).getFullYear()}
                    </p>

                    {/* Contact List - Horizontal Row */}
                    <div className="flex flex-wrap items-center gap-8 w-full">

                        {/* Email Row */}
                        <div className="flex items-center gap-3 h-8">
                            <div className="text-white flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            {currentUser.emailVerified ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold text-base">
                                        {currentUser.showEmail ? currentUser.email : 'Confirmado'}
                                    </span>
                                    <button
                                        onClick={toggleEmailVisibility}
                                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-out focus:outline-none shadow-inner ${showEmail ? 'bg-green-500' : 'bg-black/40 border border-white/10'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${showEmail ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-white font-bold text-base">No verificado</span>
                            )}
                        </div>

                        {/* Phone Row */}
                        <div className="flex items-center gap-3 h-8">
                            <div className="text-white flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                            {currentUser.phoneVerified ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold text-base">
                                        {currentUser.showPhone ? currentUser.phone : 'Confirmado'}
                                    </span>
                                    <button
                                        onClick={togglePhoneVisibility}
                                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-out focus:outline-none shadow-inner ${showPhone ? 'bg-green-500' : 'bg-black/40 border border-white/10'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${showPhone ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-white font-bold text-base">No verificado</span>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardProfile;
