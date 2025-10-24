
import React, { useState, useCallback } from 'react';
import { AdFormData, Media } from '../types';
import PaperclipIcon from './icons/PaperclipIcon';

interface AdFormProps {
  onCancel: () => void;
  onSubmit: (formData: AdFormData) => void;
}

const AdForm: React.FC<AdFormProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newMedia: Media[] = files.map(file => {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        return { url, type };
      });
      setMediaFiles(prev => [...prev, ...newMedia]);
    }
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
    });
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
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,video/*" onChange={handleFileChange} />
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
                                <img src={media.url} alt={`preview ${index}`} className="w-full h-full object-cover"/>
                           ): (
                                <video src={media.url} className="w-full h-full object-cover" muted/>
                           )}
                        </div>
                    ))}
                </div>
             )}
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Cancelar
          </button>
          <button type="submit" className="bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Publicar Anuncio
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdForm;
