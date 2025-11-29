import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../database';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

        try {
            const decoded: any = jwt.verify(token, secret);

            // Optional: Check if user still exists in DB
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });

            if (!user) {
                return res.status(403).json({ error: 'Usuario no encontrado o inactivo' });
            }

            req.user = user;
            next();
        } catch (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
    } else {
        res.status(401).json({ error: 'Token de autorización requerido' });
    }
};
