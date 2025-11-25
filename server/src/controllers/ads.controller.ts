import { Request, Response } from 'express';
import prisma from '../database';

export const getAds = async (req: Request, res: Response) => {
    try {
        const { category, minPrice, maxPrice, location, search, userId } = req.query;

        const where: any = {};

        if (category && category !== 'Todas') {
            where.category = String(category);
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        if (location) {
            where.location = { contains: String(location), mode: 'insensitive' };
        }

        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } },
                { uniqueCode: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        if (userId) {
            // If filtering by userId (e.g. "My Ads")
            // Note: The original code used userId in query to check favorites, 
            // but also seemed to support filtering by sellerId? 
            // Let's clarify: original code had `if (userId) filters.userId = parseInt(userId);` 
            // and then `favorites: userId ? ...` in include.
            // But it didn't seem to filter *by* userId in the `where` clause for the main query unless I missed it.
            // Wait, looking at original `getAllAds`:
            // `if (userId) filters.userId = parseInt(userId);` -> passed to `getAllAds`
            // Inside `getAllAds`: `const { ... userId } = filters;`
            // But `userId` was ONLY used for the `favorites` include, NOT for `where`.
            // HOWEVER, there was a separate `getUserAds` function in `dbUtils`.
            // Let's stick to the main `getAds` logic for now.
        }

        const ads = await prisma.ad.findMany({
            where,
            include: {
                media: { take: 10 },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        isOnline: true,
                        phoneVerified: true
                    }
                },
                favorites: userId ? {
                    where: { userId: Number(userId) },
                    select: { id: true }
                } : false
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        const formattedAds = ads.map(ad => ({
            ...ad,
            isFavorite: userId ? ad.favorites.length > 0 : false,
            favorites: undefined
        }));

        res.json(formattedAds);
    } catch (err) {
        console.error('Error getting ads:', err);
        res.status(500).json({ error: 'Error getting ads' });
    }
};

export const createAd = async (req: Request, res: Response) => {
    try {
        const adData = req.body;

        // Basic validation (will be improved with Zod later)
        if (!adData.title || adData.title.trim().length < 3) {
            return res.status(400).json({ error: 'El título debe tener al menos 3 caracteres' });
        }
        if (!adData.description || adData.description.trim().length < 10) {
            return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
        }
        if (!adData.price || adData.price < 0) {
            return res.status(400).json({ error: 'El precio debe ser un número positivo' });
        }
        if (!adData.sellerId) {
            return res.status(400).json({ error: 'ID de vendedor inválido' });
        }
        if (!adData.media || !Array.isArray(adData.media) || adData.media.length === 0) {
            return res.status(400).json({ error: 'Debe incluir al menos un archivo multimedia' });
        }

        const seller = await prisma.user.findUnique({ where: { id: Number(adData.sellerId) } });
        if (!seller) {
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        if (!seller.phoneVerified) {
            return res.status(403).json({ error: 'Debes verificar tu teléfono para publicar anuncios' });
        }

        const uniqueCode = `AD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const ad = await prisma.ad.create({
            data: {
                uniqueCode,
                title: adData.title.trim().substring(0, 200),
                description: adData.description.trim().substring(0, 2000),
                details: adData.details ? adData.details.trim().substring(0, 5000) : null,
                price: Math.round(adData.price * 100) / 100,
                category: adData.category || 'Otros',
                sellerId: Number(adData.sellerId),
                media: {
                    create: adData.media.map((m: any) => ({
                        type: m.type,
                        url: m.url
                    }))
                }
            },
            include: {
                media: true,
                seller: true
            }
        });

        res.json(ad);
    } catch (err) {
        console.error('Error creating ad:', err);
        res.status(500).json({ error: 'Error creating ad' });
    }
};

export const searchAds = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query de búsqueda requerida' });
        }

        const query = String(q);
        const ads = await prisma.ad.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { details: { contains: query, mode: 'insensitive' } },
                    { uniqueCode: { contains: query, mode: 'insensitive' } },
                    {
                        seller: {
                            name: { contains: query, mode: 'insensitive' }
                        }
                    }
                ]
            },
            include: {
                media: true,
                seller: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(ads);
    } catch (err) {
        console.error('Error searching ads:', err);
        res.status(500).json({ error: 'Error searching ads' });
    }
};

export const incrementAdViews = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ad = await prisma.ad.update({
            where: { id: Number(id) },
            data: { views: { increment: 1 } }
        });
        res.json(ad);
    } catch (err) {
        console.error('Error incrementing views:', err);
        res.status(500).json({ error: 'Error incrementing views' });
    }
};

export const featureAd = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { durationDays } = req.body;

        if (!durationDays) {
            return res.status(400).json({ error: 'Duration days is required' });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

        const ad = await prisma.ad.update({
            where: { id: Number(id) },
            data: {
                isFeatured: true,
                featuredExpiresAt: expiresAt
            }
        });
        res.json(ad);
    } catch (err) {
        console.error('Error featuring ad:', err);
        res.status(500).json({ error: 'Error featuring ad' });
    }
};
