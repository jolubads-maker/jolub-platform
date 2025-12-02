import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../database.js';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Try cookie first (Secure)
    let token = req.cookies?.jwt;

    // 2. Fallback to Authorization header (Mobile/Legacy)
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Token de autorización requerido' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL: JWT_SECRET is not defined in middleware.');
        return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

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
};
