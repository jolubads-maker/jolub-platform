import { z } from 'zod';

export const GetAdsQuerySchema = z.object({
    category: z.string().optional(),
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().transform(Number).optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20')
});

export type GetAdsQuery = z.infer<typeof GetAdsQuerySchema>;
