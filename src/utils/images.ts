/**
 * Optimizes Cloudinary image URLs by adding transformation parameters
 * @param url - The original image URL
 * @param width - Optional width parameter (default: 400)
 * @returns Optimized URL with f_auto,q_auto transformations
 */
export const optimizeCloudinaryUrl = (url: string, width: number = 400): string => {
    if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
        return url;
    }

    // Check if already optimized
    if (url.includes('f_auto,q_auto')) {
        return url;
    }

    // Add optimization parameters
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

/**
 * Generates a responsive srcset for Cloudinary images
 * @param url - The original image URL
 * @returns srcset string with multiple sizes
 */
export const generateCloudinarySrcSet = (url: string): string => {
    if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
        return url;
    }

    const widths = [320, 640, 960, 1280];
    return widths
        .map(w => `${optimizeCloudinaryUrl(url, w)} ${w}w`)
        .join(', ');
};
