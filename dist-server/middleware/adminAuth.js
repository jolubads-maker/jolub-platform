import prisma from '../database.js';
export const adminAuth = async (req, res, next) => {
    try {
        // The user should already be authenticated by the 'auth' middleware
        // which populates req.user
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de administrador.' });
        }
        next();
    }
    catch (error) {
        console.error('Error en adminAuth:', error);
        res.status(500).json({ message: 'Error de servidor al verificar permisos' });
    }
};
