import prisma from '../database.js';
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
                points: true,
                phoneVerified: true,
                emailVerified: true
            }
        });
        res.json(users);
    }
    catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ error: 'Error getting users' });
    }
};
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
                points: true,
                phoneVerified: true,
                emailVerified: true,
                // Don't expose sensitive data like password, email, phone unless authorized
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    }
    catch (err) {
        console.error('Error getting user:', err);
        res.status(500).json({ error: 'Error getting user' });
    }
};
export const checkUsername = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Username es requerido' });
        }
        const user = await prisma.user.findUnique({
            where: { username: String(username).toLowerCase().trim() }
        });
        res.json({ available: !user });
    }
    catch (err) {
        console.error('Error checking username:', err);
        res.status(500).json({ error: 'Error checking username' });
    }
};
export const checkEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }
        const user = await prisma.user.findUnique({
            where: { email: String(email).toLowerCase().trim() }
        });
        res.json({ available: !user });
    }
    catch (err) {
        console.error('Error checking email:', err);
        res.status(500).json({ error: 'Error checking email' });
    }
};
export const updateOnlineStatus = async (req, res) => {
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
    }
    catch (err) {
        console.error('Error updating online status:', err);
        res.status(500).json({ error: 'Error updating online status' });
    }
};
export const updateAvatar = async (req, res) => {
    try {
        const { id } = req.params;
        const { avatar } = req.body;
        if (!avatar)
            return res.status(400).json({ error: 'Avatar URL requerida' });
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: { avatar: String(avatar) }
        });
        res.json(user);
    }
    catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ error: 'Error updating avatar' });
    }
};
export const verifyUserPhone = async (req, res) => {
    try {
        const { id } = req.params;
        const { phoneNumber } = req.body;
        const currentUser = await prisma.user.findUnique({ where: { id: Number(id) } });
        const dataToUpdate = {
            phone: String(phoneNumber),
            phoneVerified: true
        };
        if (currentUser && !currentUser.phoneVerified) {
            dataToUpdate.points = { increment: 20 };
        }
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });
        res.json(user);
    }
    catch (err) {
        console.error('Error verifying phone:', err);
        res.status(500).json({ error: 'Error verifying phone' });
    }
};
export const getUserFavorites = async (req, res) => {
    try {
        const { userId } = req.params;
        const favorites = await prisma.favorite.findMany({
            where: { userId: Number(userId) },
            include: {
                ad: {
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
    }
    catch (err) {
        console.error('Error getting favorites:', err);
        res.status(500).json({ error: 'Error getting favorites' });
    }
};
export const addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { adId } = req.body;
        if (!adId) {
            return res.status(400).json({ error: 'adId es requerido' });
        }
        const favorite = await prisma.favorite.create({
            data: {
                userId: Number(userId),
                adId: Number(adId)
            }
        });
        res.json(favorite);
    }
    catch (err) {
        console.error('Error adding favorite:', err);
        res.status(500).json({ error: 'Error adding favorite' });
    }
};
export const removeFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { adId } = req.query;
        if (!adId) {
            return res.status(400).json({ error: 'adId es requerido' });
        }
        await prisma.favorite.deleteMany({
            where: {
                userId: Number(userId),
                adId: Number(adId)
            }
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error removing favorite:', err);
        res.status(500).json({ error: 'Error removing favorite' });
    }
};
export const updatePrivacy = async (req, res) => {
    try {
        const { id } = req.params;
        const { showEmail, showPhone } = req.body;
        const dataToUpdate = {};
        if (typeof showEmail === 'boolean')
            dataToUpdate.showEmail = showEmail;
        if (typeof showPhone === 'boolean')
            dataToUpdate.showPhone = showPhone;
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });
        res.json(user);
    }
    catch (err) {
        console.error('Error updating privacy:', err);
        res.status(500).json({ error: 'Error updating privacy settings' });
    }
};
export const rateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { points } = req.body;
        if (typeof points !== 'number') {
            return res.status(400).json({ error: 'Points must be a number' });
        }
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                points: {
                    increment: points
                }
            }
        });
        res.json(user);
    }
    catch (err) {
        console.error('Error rating user:', err);
        res.status(500).json({ error: 'Error rating user' });
    }
};
