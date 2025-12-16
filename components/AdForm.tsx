import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AdFormData, Media, AdCategory } from '../src/types';
import PaperclipIcon from './icons/PaperclipIcon';
import { storageService } from '../services/storageService';
import { notify } from '../services/notificationService';
import { compressImage, FAST_UPLOAD_OPTIONS } from '../src/utils/imageOptimizer';
import { useAuthStore } from '../store/useAuthStore';
import { useAdStore } from '../store/useAdStore';
import { getAdLimitForPlan } from './PricingPage';

interface AdFormProps {
  onCancel: () => void;
  onSubmit: (formData: AdFormData) => void;
}

// 📂 CATEGORÍAS Y SUBCATEGORÍAS
const CATEGORIES_DATA: Record<AdCategory, string[]> = {
  'Bienes raíces': ['Casa', 'Apartamentos', 'Negocios / Bodegas', 'Terrenos'],
  'Vehículos': ['Automóvil', 'Camionetas / Sub', 'Motos', 'Camiones / Buses', 'Botes / Lanchas'],
  'Articulos Varios': [
    'Celulares/Tablet/SmartWatch', 'Computadoras', 'Articulos del Hogar',
    'Ropa Adulto', 'Ropa Adolecentes', 'Ropa Niños', 'Articulos personales'
  ],
  'Servicios profesionales': [
    'Abogados', 'Ingenieros', 'Contabilidad / Auditoría', 'Médicos',
    'Veterinaria', 'Publicidad', 'Eróticos', 'Otros servicios'
  ]
};

// 📍 DEPARTAMENTOS DE NICARAGUA
const DEPARTMENTS = [
  'Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega',
  'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia',
  'Río San Juan', 'Rivas', 'Región Autónoma de la Costa Caribe Norte',
  'Región Autónoma de la Costa Caribe Sur'
];

// 📸 LÍMITES DE IMÁGENES
const getMediaLimit = (category: AdCategory, subcategory: string): number => {
  if (category === 'Bienes raíces') return 12;
  if (category === 'Vehículos' || category === 'Articulos Varios') return 8;
  if (category === 'Servicios profesionales') {
    if (subcategory === 'Eróticos / Profesionales') return 8;
    return 3;
  }
  return 5; // Default fallback
};

const AdForm: React.FC<AdFormProps> = ({ onCancel, onSubmit }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { ads } = useAdStore();

  // Estados del formulario
  const [category, setCategory] = useState<AdCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);

  // Estados de UI
  const [uploading, setUploading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Verificar límite de anuncios del plan
  const userPlan = currentUser?.subscriptionPlan || 'free';
  const adLimit = getAdLimitForPlan(userPlan);
  const userAdsCount = currentUser ? ads.filter(ad => ad.sellerId === currentUser.providerId || ad.sellerId === currentUser.uid || String(ad.sellerId) === String(currentUser.id)).length : 0;
  const canPublish = userAdsCount < adLimit;

  // Mostrar modal si excede límite
  useEffect(() => {
    if (!canPublish && !showLimitModal) {
      setShowLimitModal(true);
    }
  }, [canPublish]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategory('');
  }, [category]);

  const uploadToFirebase = async (file: File): Promise<string> => {
    try {
      // Comprimir imagen usando utilidad (1MB max, 1920px max para buena calidad)
      // Usamos FAST_UPLOAD_OPTIONS para balance entre calidad y velocidad de subida
      const compressedFile = await compressImage(file, FAST_UPLOAD_OPTIONS);
      const url = await storageService.uploadImage(compressedFile, 'ads');
      return url;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!category) {
      notify.error('Selecciona una categoría primero');
      return;
    }

    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const limit = getMediaLimit(category, subcategory);

      if (mediaFiles.length + files.length > limit) {
        notify.error(`Límite excedido. Máximo ${limit} imágenes para esta categoría.`);
        return;
      }

      // Validar tamaño (5MB)
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          notify.error(`El archivo ${file.name} excede el límite de 5MB.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setUploading(true);
      try {
        const uploadPromises = validFiles.map(async (file) => {
          const url = await uploadToFirebase(file);
          const type = (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video';
          return { url, type } as Media;
        });

        const newMedia = await Promise.all(uploadPromises);
        setMediaFiles(prev => [...prev, ...newMedia]);
      } catch (error) {
        notify.error('Error al subir archivos.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveMedia = (indexToRemove: number) => {
    setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSetMainImage = (index: number) => {
    setMediaFiles(prev => {
      const newMedia = [...prev];
      const [item] = newMedia.splice(index, 1);
      newMedia.unshift(item);
      return newMedia;
    });
    notify.success('Imagen principal actualizada');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) { notify.error('Selecciona una categoría'); return; }
    if (!subcategory) { notify.error('Selecciona una subcategoría'); return; }
    if (!location) { notify.error('Selecciona una ubicación'); return; }
    if (!title.trim()) { notify.error('El título es obligatorio'); return; }
    if (title.length > 50) { notify.error('El título no puede exceder 50 caracteres'); return; }
    if (!description.trim()) { notify.error('La descripción es obligatoria'); return; }
    if (description.length > 500) { notify.error('La descripción no puede exceder 500 caracteres'); return; }
    if (!price || parseFloat(price) <= 0) { notify.error('El precio debe ser mayor a 0'); return; }
    if (mediaFiles.length === 0) { notify.error('Debes subir al menos una imagen'); return; }

    try {
      await onSubmit({
        title,
        description,
        price: parseFloat(price),
        media: mediaFiles,
        category: category as AdCategory,
        subcategory,
        location
      });
    } catch (error: any) {
      console.error('Error al publicar anuncio:', error);
      if (error.message?.includes('500') || error.message?.includes('notification') || error.status === 500) {
        alert('El anuncio se guardó, pero hubo un error con las notificaciones.');
      } else {
        notify.error(error.message || 'Error al publicar el anuncio');
      }
    }
  };

  const inputClasses = (fieldName: string) => `
    w-full bg-white border-2 
    ${focusedField === fieldName ? 'border-[#6e0ad6]' : 'border-black'} 
    text-black font-medium rounded-xl p-4 
    transition-all duration-300 ease-out
    placeholder-gray-400 focus:outline-none
  `;

  return (
    <div className="min-h-screen bg-[#6e0ad6] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-3xl font-black text-[#6e0ad6]">
              Publicar Anuncio
            </h2>
            <p className="text-gray-500 text-sm mt-1">Completa los detalles de tu publicación</p>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* SECCIÓN 1: CLASIFICACIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoría */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black ml-1">1. Categoría</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AdCategory)}
                  onFocus={() => setFocusedField('category')}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputClasses('category')} appearance-none cursor-pointer`}
                >
                  <option value="" className="bg-white text-gray-500">Seleccionar categoría...</option>
                  {Object.keys(CATEGORIES_DATA).map(cat => (
                    <option key={cat} value={cat} className="bg-white text-gray-900">{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>

            {/* Subcategoría */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black ml-1">Subcategoría</label>
              <div className="relative">
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  onFocus={() => setFocusedField('subcategory')}
                  onBlur={() => setFocusedField(null)}
                  disabled={!category}
                  className={`${inputClasses('subcategory')} appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="" className="bg-white text-gray-500">
                    {category ? 'Seleccionar subcategoría...' : 'Primero selecciona categoría'}
                  </option>
                  {category && CATEGORIES_DATA[category as AdCategory].map(sub => (
                    <option key={sub} value={sub} className="bg-white text-gray-900">{sub}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: UBICACIÓN */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-black ml-1">2. Ubicación</label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
                className={`${inputClasses('location')} appearance-none cursor-pointer`}
              >
                <option value="" className="bg-white text-gray-500">Seleccionar departamento...</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept} className="bg-white text-gray-900">{dept}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLES */}
          <div className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <div className="flex justify-between ml-1">
                <label className="text-sm font-bold text-black">3. Título</label>
                <span className={`text-xs ${title.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>
                  {title.length}/50
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                className={inputClasses('title')}
                placeholder="Ej: Vendo Casa en Managua..."
                maxLength={50}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <div className="flex justify-between ml-1">
                <label className="text-sm font-bold text-black">4. Descripción</label>
                <span className={`text-xs ${description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                rows={5}
                className={inputClasses('description')}
                placeholder="Describe detalladamente tu producto o servicio..."
                maxLength={500}
              />
            </div>

            {/* Costo */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black ml-1">5. Costo ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onFocus={() => setFocusedField('price')}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputClasses('price')} pl-8 font-mono text-lg`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 6: GALERÍA */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-black">6. Galería Multimedia</label>
              <span className="text-xs text-gray-500">
                {category ? `Máx: ${getMediaLimit(category as AdCategory, subcategory)} archivos` : 'Selecciona categoría'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AnimatePresence>
                {mediaFiles.map((media, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative aspect-square rounded-xl overflow-hidden group border ${index === 0 ? 'border-[#6e0ad6] ring-2 ring-[#6e0ad6]/30' : 'border-gray-200'}`}
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" muted />
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(index)}
                          className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full backdrop-blur-sm transition-colors"
                        >
                          Hacer Principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                      >
                        ✕
                      </button>
                    </div>

                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-[#6e0ad6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Principal
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <label className={`
                relative aspect-square rounded-xl border-2 border-dashed border-gray-300 
                flex flex-col items-center justify-center cursor-pointer
                hover:border-[#6e0ad6]/50 hover:bg-[#6e0ad6]/5 transition-all group
                ${uploading ? 'opacity-50 pointer-events-none' : ''}
              `}>
                <div className="p-3 bg-gray-100 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-[#6e0ad6] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperclipIcon className="w-6 h-6 text-gray-400 group-hover:text-[#6e0ad6]" />
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium group-hover:text-[#6e0ad6]">
                  {uploading ? 'Subiendo...' : 'Añadir'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Máx 5MB por archivo. La primera imagen será la portada del anuncio.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-all"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={uploading}
              className="
                bg-[#b94509]
                hover:shadow-lg hover:shadow-[#b94509]/25
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-bold py-3 px-8 rounded-xl 
                transition-all duration-300
              "
            >
              {uploading ? 'Procesando...' : 'Publicar Anuncio'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Modal de límite de anuncios */}
      <AnimatePresence>
        {showLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-md w-full border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.3)]"
            >
              <div className="text-center">
                <span className="text-6xl mb-4 block">🚫</span>
                <h3 className="text-2xl font-bold text-white mb-2">Límite de Anuncios Alcanzado</h3>
                <p className="text-gray-400 mb-6">
                  Tu plan <span className="text-purple-400 font-bold uppercase">{userPlan}</span> permite hasta <span className="text-white font-bold">{adLimit}</span> anuncios.
                  <br />
                  Actualmente tienes <span className="text-red-400 font-bold">{userAdsCount}</span> anuncios activos.
                </p>

                <div className="bg-white/10 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-300">
                    Mejora tu plan para publicar más anuncios y acceder a funciones premium.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl font-bold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
                  >
                    🚀 Mejorar Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdForm;
