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
            const searchQuery = String(search).split(' ').join(' & ');
            where.OR = [
                { title: { search: searchQuery } },
                { description: { search: searchQuery } },
                { uniqueCode: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        if (req.query.sellerId) {
            // Filter by sellerId if specifically requested
            where.sellerId = Number(req.query.sellerId);
        }

        // userId is used for favorites check, NOT for filtering by default


        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const ads = await prisma.ad.findMany({
            where,
            include: {
                media: { take: 1 }, // Optimize: only fetch 1 image for list view
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
            take: limit,
            skip
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
            return res.status(400).json({ error: 'El t├¡tulo debe tener al menos 3 caracteres' });
        }
        if (!adData.description || adData.description.trim().length < 10) {
            return res.status(400).json({ error: 'La descripci├│n debe tener al menos 10 caracteres' });
        }
        if (!adData.price || adData.price < 0) {
            return res.status(400).json({ error: 'El precio debe ser un n├║mero positivo' });
        }
        if (!adData.sellerId) {
            return res.status(400).json({ error: 'ID de vendedor inv├ílido' });
        }
        if (!adData.media || !Array.isArray(adData.media) || adData.media.length === 0) {
            return res.status(400).json({ error: 'Debe incluir al menos un archivo multimedia' });
        }

        const seller = await prisma.user.findUnique({ where: { id: Number(adData.sellerId) } });
        if (!seller) {
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        if (!seller.phoneVerified) {
            return res.status(403).json({ error: 'Debes verificar tu tel├®fono para publicar anuncios' });
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
                subcategory: adData.subcategory,
                location: adData.location,
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
            return res.status(400).json({ error: 'Query de b├║squeda requerida' });
        }

        const searchQuery = String(q).split(' ').join(' & ');
        const ads = await prisma.ad.findMany({
            where: {
                OR: [
                    { title: { search: searchQuery } },
                    { description: { search: searchQuery } },
                    { details: { search: searchQuery } },
                    { uniqueCode: { contains: String(q), mode: 'insensitive' } },
                    {
                        seller: {
                            name: { contains: String(q), mode: 'insensitive' }
                        }
                    }
                ]
            },
            include: {
                media: { take: 1 },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        isOnline: true,
                        phoneVerified: true
                    }
                }
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

        const adId = Number(id);
        const daysToAdd = parseInt(durationDays);

        // 1. Get current ad state
        const currentAd = await prisma.ad.findUnique({
            where: { id: adId },
            select: { createdAt: true, expiresAt: true }
        });

        if (!currentAd) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        // 2. Calculate current expiration date
        // Default expiration is 7 days from creation if not set
        let currentExpiration = currentAd.expiresAt
            ? new Date(currentAd.expiresAt)
            : new Date(new Date(currentAd.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);

        // 3. Add purchased days to the current expiration
        const newExpiration = new Date(currentExpiration.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        // Calculate featured expiration (from now)
        const featuredExpiresAt = new Date();
        featuredExpiresAt.setDate(featuredExpiresAt.getDate() + daysToAdd);

        // 4. Update ad
        const ad = await prisma.ad.update({
            where: { id: adId },
            data: {
                isFeatured: true,
                featuredExpiresAt: featuredExpiresAt,
                expiresAt: newExpiration
            }
        });
        res.json(ad);
    } catch (err) {
        console.error('Error featuring ad:', err);
        res.status(500).json({ error: 'Error featuring ad' });
    }
};

export const getAdByUniqueCode = async (req: Request, res: Response) => {
    try {
        const { uniqueCode } = req.params;
        const ad = await prisma.ad.findUnique({
            where: { uniqueCode },
            include: {
                media: true, // Fetch ALL media
                seller: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        isOnline: true,
                        phoneVerified: true,
                        points: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!ad) {
            return res.status(404).json({ error: 'Anuncio no encontrado' });
        }

        res.json(ad);
    } catch (err) {
        console.error('Error getting ad by unique code:', err);
        res.status(500).json({ error: 'Error getting ad' });
    }
};
