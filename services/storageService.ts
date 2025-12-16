// Firebase Storage Service
// Maneja la subida y eliminación de imágenes

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { storage } from '../src/config/firebase';

// Generar nombre único para archivos
const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${timestamp}_${random}.${extension}`;
};

export const storageService = {
    /**
     * Subir una imagen a Firebase Storage
     * @param file - Archivo a subir
     * @param folder - Carpeta destino (ej: 'ads', 'avatars')
     * @returns URL pública de la imagen
     */
    async uploadImage(file: File, folder: string = 'ads'): Promise<string> {
        try {
            const fileName = generateFileName(file.name);
            const storageRef = ref(storage, `${folder}/${fileName}`);

            // Subir archivo
            const snapshot = await uploadBytes(storageRef, file);

            // Obtener URL pública
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log('📸 Imagen subida:', downloadURL);
            return downloadURL;
        } catch (error: any) {
            console.error('Error subiendo imagen:', error);
            throw new Error('Error al subir la imagen: ' + error.message);
        }
    },

    /**
     * Subir múltiples imágenes
     * @param files - Array de archivos
     * @param folder - Carpeta destino
     * @returns Array de URLs
     */
    async uploadMultipleImages(files: File[], folder: string = 'ads'): Promise<string[]> {
        const uploadPromises = files.map(file => this.uploadImage(file, folder));
        return Promise.all(uploadPromises);
    },

    /**
     * Eliminar una imagen de Firebase Storage
     * @param url - URL de la imagen a eliminar
     */
    async deleteImage(url: string): Promise<void> {
        try {
            // Extraer la referencia del storage desde la URL
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
            console.log('🗑️ Imagen eliminada:', url);
        } catch (error: any) {
            // Si el archivo no existe, ignorar el error
            if (error.code === 'storage/object-not-found') {
                console.warn('Imagen no encontrada, ignorando:', url);
                return;
            }
            console.error('Error eliminando imagen:', error);
            throw new Error('Error al eliminar la imagen');
        }
    },

    /**
     * Subir imagen desde base64
     * @param base64Data - Datos en base64
     * @param fileName - Nombre del archivo
     * @param folder - Carpeta destino
     * @returns URL pública
     */
    async uploadBase64Image(base64Data: string, fileName: string, folder: string = 'ads'): Promise<string> {
        try {
            // Convertir base64 a Blob
            const response = await fetch(base64Data);
            const blob = await response.blob();

            const file = new File([blob], fileName, { type: blob.type });
            return this.uploadImage(file, folder);
        } catch (error: any) {
            console.error('Error subiendo imagen base64:', error);
            throw new Error('Error al subir la imagen');
        }
    }
};

export default storageService;
