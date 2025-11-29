import { z } from 'zod';
export const userSchema = z.object({
    body: z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        email: z.string().email("Email inválido").optional(),
        avatar: z.string().url("URL de avatar inválida").optional(),
        provider: z.enum(['google', 'apple', 'manual']).optional(),
        providerId: z.string().optional(),
        username: z.string().min(3, "El usuario debe tener al menos 3 caracteres").optional(),
        ip: z.string().optional(),
        country: z.string().optional()
    })
});
export const updateUserStatusSchema = z.object({
    body: z.object({
        isOnline: z.boolean()
    })
});
export const verifyPhoneSchema = z.object({
    body: z.object({
        phoneNumber: z.string().min(8, "Número de teléfono inválido")
    })
});
export const updatePrivacySchema = z.object({
    body: z.object({
        showEmail: z.boolean().optional(),
        showPhone: z.boolean().optional()
    })
});
export const rateUserSchema = z.object({
    body: z.object({
        points: z.number().int()
    })
});
export const updateAvatarSchema = z.object({
    body: z.object({
        avatar: z.string().url("URL de avatar inválida")
    })
});
