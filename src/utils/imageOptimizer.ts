/**
 * Utilidad de optimización de imágenes para Web Vitals
 * Usa browser-image-compression para comprimir imágenes antes de subirlas
 */

import imageCompression from 'browser-image-compression';

// Tipos de opciones de compresión
export interface ImageCompressionOptions {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker: boolean;
    fileType?: string;
    initialQuality?: number;
    preserveExif?: boolean;
}

// Configuración por defecto optimizada para Web Vitals
export const DEFAULT_COMPRESSION_OPTIONS: ImageCompressionOptions = {
    maxSizeMB: 1,                // Máximo 1MB como solicitado
    maxWidthOrHeight: 1920,      // Máximo 1920px como solicitado
    useWebWorker: true,          // Usar Web Worker para no bloquear UI
    fileType: 'image/jpeg',      // Convertir a JPEG para mejor compresión
    initialQuality: 0.85,        // Calidad 85% para buen balance
    preserveExif: false,         // Eliminar metadatos para reducir tamaño
};

// Configuración agresiva para thumbnails o previews
export const THUMBNAIL_COMPRESSION_OPTIONS: ImageCompressionOptions = {
    maxSizeMB: 0.1,              // Máximo 100KB
    maxWidthOrHeight: 400,       // Máximo 400px
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.7,
    preserveExif: false,
};

// Configuración para subida rápida (más agresiva)
export const FAST_UPLOAD_OPTIONS: ImageCompressionOptions = {
    maxSizeMB: 0.3,              // Máximo 300KB
    maxWidthOrHeight: 1080,      // Máximo 1080px
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.75,
    preserveExif: false,
};

/**
 * Comprime una imagen individual
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión (opcional)
 * @returns Promise<File> - Archivo comprimido
 */
export const compressImage = async (
    file: File,
    options: ImageCompressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<File> => {
    // Solo comprimir imágenes, no videos u otros archivos
    if (!file.type.startsWith('image/')) {
        console.log(`⏭️ Saltando compresión (no es imagen): ${file.name}`);
        return file;
    }

    // No comprimir GIFs animados (pueden perder animación)
    if (file.type === 'image/gif') {
        console.log(`⏭️ Saltando compresión (GIF): ${file.name}`);
        return file;
    }

    const originalSize = file.size / 1024; // KB
    console.log(`📦 Comprimiendo: ${file.name} (${originalSize.toFixed(1)}KB)`);

    try {
        const compressedFile = await imageCompression(file, {
            ...options,
            exifOrientation: options.preserveExif ? undefined : 1,
        });

        const compressedSize = compressedFile.size / 1024; // KB
        const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);

        console.log(
            `✅ Comprimido: ${compressedFile.name} ` +
            `(${compressedSize.toFixed(1)}KB) - ` +
            `Ahorro: ${savings}%`
        );

        return compressedFile;
    } catch (error) {
        console.warn(`⚠️ Error comprimiendo ${file.name}, usando original:`, error);
        return file; // Si falla, usar original
    }
};

/**
 * Comprime múltiples imágenes en paralelo
 * @param files - Array de archivos a comprimir
 * @param options - Opciones de compresión (opcional)
 * @param onProgress - Callback de progreso (opcional)
 * @returns Promise<File[]> - Array de archivos comprimidos
 */
export const compressImages = async (
    files: File[],
    options: ImageCompressionOptions = DEFAULT_COMPRESSION_OPTIONS,
    onProgress?: (current: number, total: number) => void
): Promise<File[]> => {
    const compressedFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
        const compressedFile = await compressImage(files[i], options);
        compressedFiles.push(compressedFile);

        if (onProgress) {
            onProgress(i + 1, files.length);
        }
    }

    return compressedFiles;
};

/**
 * Obtiene información de la imagen antes de comprimir
 * @param file - Archivo de imagen
 * @returns Promise con dimensiones y tamaño
 */
export const getImageInfo = (file: File): Promise<{ width: number; height: number; size: number }> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve({ width: 0, height: 0, size: file.size });
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                size: file.size,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Error cargando imagen'));
        };

        img.src = url;
    });
};

/**
 * Verifica si una imagen necesita compresión basado en los límites
 * @param file - Archivo de imagen
 * @param options - Opciones con límites
 * @returns Promise<boolean>
 */
export const needsCompression = async (
    file: File,
    options: ImageCompressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<boolean> => {
    // Si excede el tamaño máximo
    if (file.size > options.maxSizeMB * 1024 * 1024) {
        return true;
    }

    // Verificar dimensiones
    try {
        const info = await getImageInfo(file);
        if (info.width > options.maxWidthOrHeight || info.height > options.maxWidthOrHeight) {
            return true;
        }
    } catch {
        return true; // Si no podemos verificar, comprimir por seguridad
    }

    return false;
};

export default {
    compressImage,
    compressImages,
    getImageInfo,
    needsCompression,
    DEFAULT_COMPRESSION_OPTIONS,
    THUMBNAIL_COMPRESSION_OPTIONS,
    FAST_UPLOAD_OPTIONS,
};
