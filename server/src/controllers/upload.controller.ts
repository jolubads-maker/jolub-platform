import { Request, Response } from 'express';
import { uploadFile } from '../services/storage.service';

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }

        const url = await uploadFile(req.file);
        res.json({ url });
    } catch (error: any) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Error al subir la imagen', details: error.message });
    }
};
