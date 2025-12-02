import { z } from 'zod';
export const GetAdsQuerySchema = z.object({
    category: z.string().optional(),
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().transform(Number).optional(),
    page: z.string().default('1').transform(Number),
    limit: z.string().default('20').transform(Number)
});
