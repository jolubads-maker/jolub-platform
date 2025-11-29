import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Email inválido' }),
        password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    })
});

export const syncUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
        email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
        provider: z.string().optional(),
        providerId: z.string().optional(),
        avatar: z.string().url({ message: 'Avatar debe ser una URL válida' }).optional().nullable(),
        username: z.string().optional().nullable(),
        password: z.string().optional()
    })
});

export const tokenSchema = z.object({
    body: z.object({
        sessionToken: z.string().optional()
    })
});
