import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Express } from 'express';

// Initialize S3 Client for Cloudflare R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
    }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

export const uploadFile = async (file: Express.Multer.File): Promise<string> => {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !BUCKET_NAME) {
        throw new Error('R2 credentials not configured');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const key = `uploads/${fileName}`;

    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read' // R2 doesn't support ACLs the same way, usually managed by bucket policy or public access
        });

        await r2Client.send(command);

        // Return the public URL
        // If using a custom domain or R2.dev subdomain
        if (PUBLIC_DOMAIN) {
            return `${PUBLIC_DOMAIN}/${key}`;
        } else {
            // Fallback if no public domain configured (might not work without public access enabled on bucket)
            return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`;
        }
    } catch (error) {
        console.error('Error uploading to R2:', error);
        throw new Error('Error uploading file to storage');
    }
};
