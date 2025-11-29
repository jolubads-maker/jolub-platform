import { z } from 'zod';

export const addFavoriteSchema = z.object({
    body: z.object({
        adId: z.number().int().positive()
    })
});

export const removeFavoriteSchema = z.object({
    query: z.object({
        adId: z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0, { message: "adId inválido" })
    })
});
