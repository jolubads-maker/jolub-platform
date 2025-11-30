import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const slides = [
    {
        id: 1,
        title: "Tecnología de Punta",
        subtitle: "Encuentra los mejores gadgets y dispositivos.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        category: "Tecnología"
    },
    {
        id: 2,
        title: "Vehículos Increíbles",
        subtitle: "Tu próximo auto te está esperando.",
        image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2047&q=80",
        category: "Vehículos"
    },
    {
        id: 3,
        title: "Moda y Estilo",
        subtitle: "Renueva tu guardarropa con las mejores marcas.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        category: "Moda"
    },
    {
        id: 4,
        title: "Hogar Dulce Hogar",
        subtitle: "Todo lo que necesitas para tu espacio.",
        image: "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        category: "Hogar"
    }
];

const HeroCarousel: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl shadow-2xl mb-12 group">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slides[current].image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 z-10">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-2xl"
                    >
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-tight">
                            {slides[current].title}
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
                            {slides[current].subtitle}
                        </p>
                        <button
                            onClick={() => navigate(`/search?category=${slides[current].category}`)}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:bg-olx-orange hover:text-white transition-all transform hover:scale-105 shadow-lg"
                        >
                            Explorar {slides[current].category}
                        </button>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === current ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
