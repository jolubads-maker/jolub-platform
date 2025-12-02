import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

// --- SCHEMAS ---

export const userSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido").optional(),
    avatar: z.string().url("URL de avatar inválida").optional(),
    provider: z.enum(['google', 'apple', 'manual']).optional(),
    providerId: z.string().optional(),
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres").optional(),
    ip: z.string().optional(),
    country: z.string().optional()
});

export const adSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    details: z.string().optional(),
    price: z.number().min(0, "El precio no puede ser negativo"),
    sellerId: z.number().int().positive(),
    category: z.string().min(1, "La categoría es requerida"),
    location: z.string().optional(),
    media: z.array(z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url()
    })).min(1, "Debes subir al menos una imagen o video")
});

export const chatSchema = z.object({
    participantIds: z.array(z.number().int().positive()).min(2, "Se requieren al menos 2 participantes")
});

export const messageSchema = z.object({
    userId: z.number().int().positive(),
    text: z.string().min(1, "El mensaje no puede estar vacío"),
    sender: z.enum(['user', 'seller', 'buyer'])
});

// --- MIDDLEWARE ---

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: "Datos inválidos",
                    details: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            next(error);
        }
    };
};
