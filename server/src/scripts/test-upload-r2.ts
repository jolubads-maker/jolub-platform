import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting R2 Upload Test...');

    // 1. Get User
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('Creating test user...');
        user = await prisma.user.create({
            data: {
                email: 'test_r2@example.com',
                name: 'Test User R2',
                password: 'password123',
                username: 'testuser_r2',
                avatar: 'https://example.com/avatar.png'
            }
        });
    }
    console.log(`User found: ${user.id}`);

    // 2. Generate Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('❌ JWT_SECRET not found in env');
        process.exit(1);
    }
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });

    // 3. Upload
    const formData = new FormData();
    const file = new Blob(['Hello R2 World ' + Date.now()], { type: 'text/plain' });
    formData.append('file', file, 'test-r2.txt');

    console.log('Uploading to http://localhost:4000/api/upload...');
    try {
        const response = await fetch('http://localhost:4000/api/upload', {
            method: 'POST',
            headers: {
                'Cookie': `jwt=${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Upload Success!');
            console.log('URL:', data.url);
        } else {
            const text = await response.text();
            console.error('❌ Upload Failed:', response.status, text);
        }
    } catch (error) {
        console.error('❌ Connection Error:', error);
    }
}

main()
    .catch((e: any) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
