import React, { useState } from 'react';
import { AdFormData, Media } from '../types';
import PaperclipIcon from './icons/PaperclipIcon';

interface AdFormProps {
  onCancel: () => void;
  onSubmit: (formData: AdFormData) => void;
}

// 🔧 CONFIGURACIÓN CLOUDINARY
// Reemplaza estos valores con los de tu cuenta de Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dim5dxlil';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

const AdForm: React.FC<AdFormProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);

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
        // Subir todas las imágenes en paralelo
        const uploadPromises = files.map(async (file) => {
          const url = await uploadToCloudinary(file);
          const type = (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video';
          return { url, type, file } as Media;
        });

        const newMedia = await Promise.all(uploadPromises);
        setMediaFiles(prev => [...prev, ...newMedia]);
      } catch (error) {
        alert('Error al subir las imágenes. Verifica tu configuración.');
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
    if (!title || !description || !price || mediaFiles.length === 0) {
      alert('Por favor, complete todos los campos y suba al menos un archivo.');
      return;
    }
    onSubmit({
      title,
      description,
      details,
      price: parseFloat(price),
      media: mediaFiles,
      uniqueCode: `AD-${Math.floor(Math.random() * 100000)}`,
      category: 'Otros',
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-light">Crear Nuevo Anuncio</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Título</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
            placeholder="Ej: iPhone 13 Pro Max - Como nuevo"
            required
          />
        </div>

        {/* Precio */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Precio ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">$</span>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 pl-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
            placeholder="Describe brevemente tu producto..."
            required
          />
        </div>

        {/* Detalles */}
        <div>
          <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-1">Detalles adicionales</label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Especificaciones técnicas, estado, condiciones de entrega..."
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Subida de Imágenes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Imágenes y Videos</label>

          <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md transition-colors ${uploading ? 'bg-gray-700 opacity-50 cursor-wait' : 'hover:border-brand-primary hover:bg-gray-750'}`}>
            <div className="space-y-1 text-center">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-2"></div>
                  <p className="text-sm text-gray-300">Subiendo archivos a la nube...</p>
                </div>
              ) : (
                <>
                  <PaperclipIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-brand-secondary hover:text-brand-primary focus-within:outline-none">
                      <span>Subir archivos</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,video/*" onChange={handleFileChange} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, MP4 hasta 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Galería de Previsualización */}
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-black border border-gray-600">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="bg-brand-primary hover:bg-brand-dark disabled:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-brand-primary/20 transition-all transform hover:scale-105"
          >
            {uploading ? 'Subiendo...' : 'Publicar Anuncio'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdForm;