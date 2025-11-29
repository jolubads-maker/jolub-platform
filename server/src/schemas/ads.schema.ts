import { z } from 'zod';

export const adSchema = z.object({
    body: z.object({
        title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
        description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
        details: z.string().optional(),
        price: z.number().min(0, "El precio no puede ser negativo"),
        sellerId: z.number().int().positive(),
        category: z.string().min(1, "La categoría es requerida"),
        subcategory: z.string().optional(),
        location: z.string().optional(),
        media: z.array(z.object({
            type: z.enum(['image', 'video']),
            url: z.string().url()
        })).min(1, "Debes subir al menos una imagen o video")
    })
});

export const featureAdSchema = z.object({
    body: z.object({
        duration: z.number().int().positive(),
        paymentId: z.string().min(1)
    })
});
