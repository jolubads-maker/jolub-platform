
import React, { useState } from 'react';
import { AdFormData, Media } from '../types';
import PaperclipIcon from './icons/PaperclipIcon';
import { notify } from '../services/notificationService';

interface AdFormProps {
  onCancel: () => void;
  onSubmit: (formData: AdFormData) => void;
}

interface MediaFile extends Media {
  file?: File;
}

const AdForm: React.FC<AdFormProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newMedia: MediaFile[] = files.map((file: File) => {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        return { url, type, file };
      });
      setMediaFiles(prev => [...prev, ...newMedia]);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    // 1. Obtener firma del backend
    const signResponse = await fetch('http://localhost:4000/api/sign-upload');
    if (!signResponse.ok) {
      throw new Error('Error obteniendo firma de subida');
    }
    const { signature, timestamp, cloudName, apiKey } = await signResponse.json();

    // 2. Subir a Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'marketplace_ads');

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error?.message || 'Error subiendo imagen');
    }

    const data = await uploadResponse.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || mediaFiles.length === 0) {
      notify.error('Por favor, complete todos los campos y suba al menos un archivo.');
      return;
    }

    setIsUploading(true);
    const toastId = notify.loading('Subiendo imágenes y publicando...');

    try {
      // Subir archivos a Cloudinary y obtener URLs reales
      const uploadedMedia: Media[] = await Promise.all(mediaFiles.map(async (media) => {
        if (media.file) {
          const secureUrl = await uploadToCloudinary(media.file);
          return { url: secureUrl, type: media.type };
        }
        return { url: media.url, type: media.type }; // En caso de que ya sea una URL remota (edición futura)
      }));

      onSubmit({
        title,
        description,
        details,
        price: parseFloat(price),
        media: uploadedMedia,
        uniqueCode: `AD-${Math.floor(Math.random() * 100000)}`, // Generar código temporal si no lo hace el backend
        category: 'Otros', // Valor por defecto, se podría agregar selector
        location: 'Ubicación desconocida' // Valor por defecto
      });

      notify.dismiss(toastId);
    } catch (error) {
      console.error('Error al subir archivos:', error);
      notify.dismiss(toastId);
      notify.error('Hubo un error al subir las imágenes. Por favor intente nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-brand-light">Crear Nuevo Anuncio</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Título</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
            required
            disabled={isUploading}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
            required
            disabled={isUploading}
          />
        </div>
        <div>
          <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-1">Detalles adicionales</label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Especificaciones técnicas, estado del producto, condiciones de venta, etc."
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
            disabled={isUploading}
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Precio ($)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
            required
            min="0"
            step="0.01"
            disabled={isUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Imágenes y Videos</label>
          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <PaperclipIcon className="mx-auto h-12 w-12 text-gray-500" />
              <div className="flex text-sm text-gray-400">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-brand-secondary hover:text-brand-primary focus-within:outline-none">
                  <span>Subir archivos</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,video/*" onChange={handleFileChange} disabled={isUploading} />
                </label>
                <p className="pl-1">o arrastrar y soltar</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB; MP4, MOV hasta 100MB</p>
            </div>
          </div>
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative w-full h-24 rounded-md overflow-hidden">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300" disabled={isUploading}>
            Cancelar
          </button>
          <button type="submit" className="bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center" disabled={isUploading}>
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </>
            ) : (
              'Publicar Anuncio'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdForm;
