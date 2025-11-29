import React from 'react';
import { motion } from 'framer-motion';
import StarIcon from '../icons/StarIcon';
import EyeIcon from '../icons/EyeIcon';

interface DashboardStatsProps {
    points: number;
    adsCount: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ points, adsCount }) => {
    return (
        <>
            {/* STATS: PUNTOS */}
            <motion.div
                className="col-span-1 bg-[#6e0ad6] rounded-[2rem] p-6 flex flex-col justify-center relative overflow-hidden shadow-2xl min-h-[200px]"
            >
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-2 bg-[#ea580c] rounded-full text-white shadow-lg flex-shrink-0 mt-1">
                        <StarIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-2xl mb-1">Reputación</span>
                        <div className="text-5xl font-black text-white drop-shadow-md mb-1">{points}</div>
                        <p className="text-sm text-white/80 font-medium">Puntos de confianza</p>
                    </div>
                </div>
            </motion.div>

            {/* STATS: ANUNCIOS */}
            <motion.div
                className="col-span-1 bg-[#6e0ad6] rounded-[2rem] p-6 flex flex-col justify-center relative overflow-hidden shadow-2xl min-h-[200px]"
            >
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-2 bg-[#ea580c] rounded-full text-white shadow-lg flex-shrink-0 mt-1">
                        <EyeIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-2xl mb-1">Anuncios</span>
                        <div className="text-5xl font-black text-white drop-shadow-md mb-1">{adsCount}</div>
                        <p className="text-sm text-white/80 font-medium">Activos en el mercado</p>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default DashboardStats;
