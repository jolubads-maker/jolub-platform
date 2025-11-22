import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdFormData, Media, AdCategory } from '../types';
import PaperclipIcon from './icons/PaperclipIcon';
import { notify } from '../services/notificationService';

interface AdFormProps {
  onCancel: () => void;
  onSubmit: (formData: AdFormData) => void;
}

// 🔧 CONFIGURACIÓN CLOUDINARY
const CLOUDINARY_CLOUD_NAME = 'dim5dxlil';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

const CATEGORIES: AdCategory[] = [
  'Electrónica',
  'Vehículos',
  'Hogar',
  'Moda',
  'Deportes',
  'Juguetes',
  'Libros',
  'Otros'
];

const AdForm: React.FC<AdFormProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<AdCategory>('Otros');
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUploading(true);
      const files = Array.from(event.target.files);

      try {
        const uploadPromises = files.map(async (file) => {
          const url = await uploadToCloudinary(file);
          const type = (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video';
          return { url, type, file } as Media;
        });

        const newMedia = await Promise.all(uploadPromises);
        setMediaFiles(prev => [...prev, ...newMedia]);
      } catch (error) {
        notify.error('Error al subir las imágenes. Verifica tu configuración.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveMedia = (indexToRemove: number) => {
    setMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { notify.error('El título es obligatorio'); return; }
    if (title.length < 3) { notify.error('El título debe tener al menos 3 caracteres'); return; }
    if (!description.trim()) { notify.error('La descripción es obligatoria'); return; }
    if (!price || parseFloat(price) <= 0) { notify.error('El precio debe ser mayor a 0'); return; }
    if (mediaFiles.length === 0) { notify.error('Debes subir al menos una imagen o video'); return; }

    onSubmit({
      title,
      description,
      details,
      price: parseFloat(price),
      media: mediaFiles,
      category,
      location: 'Ubicación desconocida'
    });
  };

  const inputClasses = (fieldName: string) => `
    w-full bg-gray-800/50 border 
    ${focusedField === fieldName ? 'border-primary ring-4 ring-primary/20' : 'border-white/10'} 
    text-white rounded-xl p-4 
    transition-all duration-300 ease-out
    placeholder-gray-500 focus:outline-none
  `;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-3xl mx-auto bg-surface/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Crear Anuncio
          </h2>
          <p className="text-gray-400 text-sm mt-1">Comparte tu producto con el mundo</p>
        </div>
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div className="group">
          <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Título del anuncio</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            className={inputClasses('title')}
            placeholder="Ej: MacBook Pro M1 2021 - Impecable"
          />
          <AnimatePresence>
            {title.length > 0 && title.length < 3 && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-xs mt-2 ml-1"
              >
                El título es muy corto
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Precio */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Precio</label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-400 font-bold">$</span>
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

          {/* Categoría */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Categoría</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AdCategory)}
                onFocus={() => setFocusedField('category')}
                onBlur={() => setFocusedField(null)}
                className={`${inputClasses('category')} appearance-none cursor-pointer`}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900 text-white">{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            rows={3}
            className={inputClasses('description')}
            placeholder="Describe lo que vendes de forma atractiva..."
          />
        </div>

        {/* Detalles */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Detalles Técnicos (Opcional)</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            onFocus={() => setFocusedField('details')}
            onBlur={() => setFocusedField(null)}
            rows={4}
            className={inputClasses('details')}
            placeholder="Especificaciones, estado, dimensiones, etc."
          />
        </div>

        {/* Subida de Imágenes */}
        <div className="bg-gray-900/30 rounded-2xl p-6 border border-white/5">
          <label className="block text-sm font-bold text-gray-300 mb-4">Galería Multimedia</label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <AnimatePresence>
              {mediaFiles.map((media, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-xl overflow-hidden group border border-white/10"
                >
                  {media.type === 'image' ? (
                    <img src={media.url} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <label className={`
              relative aspect-square rounded-xl border-2 border-dashed border-white/10 
              flex flex-col items-center justify-center cursor-pointer
              hover:border-primary/50 hover:bg-primary/5 transition-all group
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}>
              <div className="p-3 bg-white/5 rounded-full mb-2 group-hover:scale-110 transition-transform">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PaperclipIcon className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                )}
              </div>
              <span className="text-xs text-gray-400 font-medium group-hover:text-primary">
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
            Soporta imágenes (JPG, PNG) y videos (MP4). Máx 10MB.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-all"
          >
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={uploading}
            className="
              bg-gradient-to-r from-primary to-accent 
              hover:shadow-lg hover:shadow-primary/25
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
  );
};

export default AdForm;