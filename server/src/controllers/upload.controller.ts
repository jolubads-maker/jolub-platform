import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const signUpload = (req: Request, res: Response) => {
    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: 'marketplace_ads',
        }, process.env.CLOUDINARY_API_SECRET!);

        res.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY
        });
    } catch (error) {
        console.error('Error generating signature:', error);
        res.status(500).json({ error: 'Error generando firma' });
    }
};
