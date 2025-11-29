import { z } from 'zod';

export const chatSchema = z.object({
    body: z.object({
        participantIds: z.array(z.number().int().positive()).min(2, "Se requieren al menos 2 participantes"),
        adId: z.number().int().positive().optional(),
        checkOnly: z.boolean().optional()
    })
});

export const messageSchema = z.object({
    body: z.object({
        userId: z.number().int().positive(),
        text: z.string().min(1, "El mensaje no puede estar vacío"),
        sender: z.string() // Allow any string for now, or restrict to 'user' | 'seller' | 'buyer'
    })
});
