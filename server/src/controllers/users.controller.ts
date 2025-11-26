import { Request, Response } from 'express';
import prisma from '../database';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ error: 'Error getting users' });
    }
};

export const checkUsername = async (req: Request, res: Response) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Username es requerido' });
        }

        const user = await prisma.user.findUnique({
            where: { username: String(username).toLowerCase().trim() }
        });

        res.json({ available: !user });
    } catch (err) {
        console.error('Error checking username:', err);
        res.status(500).json({ error: 'Error checking username' });
    }
};

export const checkEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        const user = await prisma.user.findUnique({
            where: { email: String(email).toLowerCase().trim() }
        });

        res.json({ available: !user });
    } catch (err) {
        console.error('Error checking email:', err);
        res.status(500).json({ error: 'Error checking email' });
    }
};

export const updateOnlineStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isOnline } = req.body;

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                isOnline: Boolean(isOnline),
                lastSeen: new Date()
            }
        });
        res.json(user);
    } catch (err) {
        console.error('Error updating online status:', err);
        res.status(500).json({ error: 'Error updating online status' });
    }
};

export const updateAvatar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { avatar } = req.body;

        if (!avatar) return res.status(400).json({ error: 'Avatar URL requerida' });

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: { avatar: String(avatar) }
        });
        res.json(user);
    } catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ error: 'Error updating avatar' });
    }
};

export const verifyUserPhone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phoneNumber } = req.body;

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                phone: String(phoneNumber),
                phoneVerified: true
            }
        });
        res.json(user);
    } catch (err) {
        console.error('Error verifying phone:', err);
        res.status(500).json({ error: 'Error verifying phone' });
    }
};

export const getUserFavorites = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const favorites = await prisma.favorite.findMany({
            where: { userId: Number(userId) },
            include: {
                ad: {
                    include: {
                        media: true,
                        seller: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedFavorites = favorites.map(fav => ({
            ...fav.ad,
            isFavorite: true
        }));

        res.json(formattedFavorites);
    } catch (err) {
        console.error('Error getting favorites:', err);
        res.status(500).json({ error: 'Error getting favorites' });
    }
};

export const addFavorite = async (req: Request, res: Response) => {
    try {
        const { userId, adId } = req.body;
        if (!userId || !adId) {
            return res.status(400).json({ error: 'userId y adId son requeridos' });
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId: Number(userId),
                adId: Number(adId)
            }
        });
        res.json(favorite);
    } catch (err) {
        console.error('Error adding favorite:', err);
        res.status(500).json({ error: 'Error adding favorite' });
    }
};

export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const { userId, adId } = req.query;
        if (!userId || !adId) {
            return res.status(400).json({ error: 'userId y adId son requeridos' });
        }

        await prisma.favorite.deleteMany({
            where: {
                userId: Number(userId),
                adId: Number(adId)
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing favorite:', err);
        res.status(500).json({ error: 'Error removing favorite' });
    }
};

export const updatePrivacy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { showEmail, showPhone } = req.body;

        const dataToUpdate: any = {};
        if (typeof showEmail === 'boolean') dataToUpdate.showEmail = showEmail;
        if (typeof showPhone === 'boolean') dataToUpdate.showPhone = showPhone;

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });
        res.json(user);
    } catch (err) {
        console.error('Error updating privacy:', err);
        res.status(500).json({ error: 'Error updating privacy settings' });
    }
};
