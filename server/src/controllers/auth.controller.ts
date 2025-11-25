import { Request, Response } from 'express';
import prisma from '../database';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Rate limiting map
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3;
const rateLimitMap = new Map<string, { attempts: number[] }>();

// Twilio setup
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: any = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Nodemailer setup
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const syncUser = async (req: Request, res: Response) => {
    try {
        const { name, avatar, email, provider, providerId, username, ip, country } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
        }

        if (avatar && (typeof avatar !== 'string' || !avatar.startsWith('http'))) {
            return res.status(400).json({ error: 'Avatar debe ser una URL válida' });
        }

        const sanitizedName = name.trim().substring(0, 100);
        const sanitizedEmail = email ? email.trim().toLowerCase().substring(0, 255) : null;
        const sanitizedUsername = username ? username.trim().toLowerCase().substring(0, 50) : null;

        // Find or create user logic
        let user = null;
        if (providerId) {
            user = await prisma.user.findFirst({
                where: { providerId, provider: provider || 'manual' }
            });
        }

        if (!user && sanitizedEmail) {
            user = await prisma.user.findFirst({ where: { email: sanitizedEmail } });
        }

        if (!user && sanitizedUsername) {
            user = await prisma.user.findFirst({ where: { username: sanitizedUsername } });
        }

        if (!user) {
            const uniqueId = `USER-${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sanitizedEmail || uniqueId}`;

            user = await prisma.user.create({
                data: {
                    uniqueId,
                    username: sanitizedUsername,
                    name: sanitizedName,
                    avatar: defaultAvatar,
                    email: sanitizedEmail,
                    provider: provider || 'manual',
                    providerId,
                    points: 0,
                    phoneVerified: false,
                    isOnline: true,
                    lastSeen: new Date(),
                    ip: ip || null,
                    country: country || null
                }
            });
        } else {
            const updateData: any = {
                email: sanitizedEmail || user.email,
                provider: provider || user.provider,
                providerId: providerId || user.providerId,
                isOnline: true,
                lastSeen: new Date(),
                ip: ip || user.ip,
                country: country || user.country
            };

            if (avatar) updateData.avatar = avatar;

            user = await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }

        res.json(user);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Error creando usuario' });
    }
};

export const generateSessionToken = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sessionToken = crypto.randomBytes(32).toString('hex');

        await prisma.user.update({
            where: { id: Number(id) },
            data: { sessionToken }
        });

        res.json({ sessionToken });
    } catch (err) {
        console.error('Error generating token:', err);
        res.status(500).json({ error: 'Error generando token' });
    }
};

export const authenticateWithToken = async (req: Request, res: Response) => {
    try {
        const { sessionToken } = req.body;
        if (!sessionToken) {
            return res.status(400).json({ error: 'Token de sesión requerido' });
        }

        const user = await prisma.user.findUnique({
            where: { sessionToken }
        });

        if (!user) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: true, lastSeen: new Date() }
        });

        res.json(user);
    } catch (err) {
        console.error('Error authenticating with token:', err);
        res.status(500).json({ error: 'Error de autenticación' });
    }
};

export const sendPhoneCode = async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber es requerido' });

        // Rate limiting
        const now = Date.now();
        const rateLimitData = rateLimitMap.get(phoneNumber);

        if (rateLimitData) {
            const attempts = rateLimitData.attempts.filter(ts => now - ts < RATE_LIMIT_WINDOW);
            if (attempts.length >= MAX_ATTEMPTS) {
                const nextAttempt = Math.ceil((attempts[0] + RATE_LIMIT_WINDOW - now) / 60000);
                return res.status(429).json({
                    error: `Demasiados intentos. Intenta de nuevo en ${nextAttempt} minutos.`
                });
            }
            attempts.push(now);
            rateLimitMap.set(phoneNumber, { attempts });
        } else {
            rateLimitMap.set(phoneNumber, { attempts: [now] });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));

        // Delete existing codes
        await prisma.verificationCode.deleteMany({
            where: { contact: phoneNumber, type: 'phone' }
        });

        // Create new code
        await prisma.verificationCode.create({
            data: {
                contact: phoneNumber,
                type: 'phone',
                code,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        });

        if (!twilioClient) {
            return res.status(200).json({ mock: true, message: 'Modo demo, sin envío real', code });
        }

        await twilioClient.messages.create({
            to: phoneNumber,
            from: TWILIO_PHONE_NUMBER,
            body: `Tu código de verificación para Marketplace IA es: ${code}. Válido por 5 minutos.`,
        });

        res.json({ ok: true, message: `Código enviado por SMS a ${phoneNumber}` });
    } catch (err: any) {
        console.error('Error sending SMS:', err);
        res.status(500).json({ error: err.message || 'Error enviando SMS' });
    }
};

export const verifyPhoneCode = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, code } = req.body;
        if (!phoneNumber || !code) return res.status(400).json({ error: 'Parámetros inválidos' });

        const verificationCode = await prisma.verificationCode.findUnique({
            where: {
                contact_type: {
                    contact: phoneNumber,
                    type: 'phone'
                }
            }
        });

        if (!verificationCode || verificationCode.code !== code) {
            return res.status(400).json({ error: 'Código incorrecto' });
        }

        if (verificationCode.expiresAt < new Date()) {
            await prisma.verificationCode.delete({ where: { id: verificationCode.id } });
            return res.status(400).json({ error: 'Código expirado' });
        }

        await prisma.verificationCode.delete({ where: { id: verificationCode.id } });

        await prisma.user.updateMany({
            where: { phone: phoneNumber },
            data: { phoneVerified: true }
        });

        res.json({ ok: true, message: 'Teléfono verificado exitosamente' });
    } catch (err) {
        console.error('Error verifying phone code:', err);
        res.status(500).json({ error: 'Error verificando código' });
    }
};

export const sendEmailCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email es requerido' });

        // Rate limiting
        const now = Date.now();
        const rateLimitData = rateLimitMap.get(email);

        if (rateLimitData) {
            const attempts = rateLimitData.attempts.filter(ts => now - ts < RATE_LIMIT_WINDOW);
            if (attempts.length >= MAX_ATTEMPTS) {
                const nextAttempt = Math.ceil((attempts[0] + RATE_LIMIT_WINDOW - now) / 60000);
                return res.status(429).json({
                    error: `Demasiados intentos. Intenta de nuevo en ${nextAttempt} minutos.`
                });
            }
            attempts.push(now);
            rateLimitMap.set(email, { attempts });
        } else {
            rateLimitMap.set(email, { attempts: [now] });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));

        await prisma.verificationCode.deleteMany({
            where: { contact: email, type: 'email' }
        });

        await prisma.verificationCode.create({
            data: {
                contact: email,
                type: 'email',
                code,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        });

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(200).json({ mock: true, message: 'Modo demo, código en consola', code });
        }

        const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1>JOLUB</h1>
        <p>Tu código de verificación es:</p>
        <h2>${code}</h2>
      </div>
    `;

        await emailTransporter.sendMail({
            from: `"JOLUB Marketplace" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Tu código de verificación - JOLUB',
            html: htmlContent
        });

        res.json({ ok: true, message: `Código enviado por correo a ${email}` });
    } catch (err: any) {
        console.error('Error sending email:', err);
        res.status(500).json({ error: err.message || 'Error enviando email' });
    }
};

export const verifyEmailCode = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Parámetros inválidos' });

        const verificationCode = await prisma.verificationCode.findUnique({
            where: {
                contact_type: {
                    contact: email,
                    type: 'email'
                }
            }
        });

        if (!verificationCode || verificationCode.code !== code) {
            return res.status(400).json({ error: 'Código incorrecto' });
        }

        if (verificationCode.expiresAt < new Date()) {
            await prisma.verificationCode.delete({ where: { id: verificationCode.id } });
            return res.status(400).json({ error: 'Código expirado' });
        }

        await prisma.verificationCode.delete({ where: { id: verificationCode.id } });

        await prisma.user.updateMany({
            where: { email },
            data: { emailVerified: true }
        });

        res.json({ ok: true, message: 'Email verificado exitosamente' });
    } catch (err) {
        console.error('Error verifying email code:', err);
        res.status(500).json({ error: 'Error verificando código' });
    }
};

export const getIpInfo = async (req: Request, res: Response) => {
    try {
        let ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            req.socket.remoteAddress ||
            'Unknown';

        const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1' || ip === 'Unknown';

        if (isLocalhost) {
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                ip = ipData.ip;
            } catch (ipError) {
                ip = 'Unknown';
            }
        }

        let country = 'Unknown';
        let city = 'Unknown';
        let region = 'Unknown';

        if (ip !== 'Unknown') {
            try {
                const response = await fetch(`http://ip-api.com/json/${ip}`);
                const data = await response.json();
                if (data.status === 'success') {
                    country = data.country || 'Unknown';
                    city = data.city || 'Unknown';
                    region = data.regionName || 'Unknown';
                }
            } catch (geoError) {
                // ignore
            }
        }

        res.json({ ip, country, city, region });
    } catch (err) {
        console.error('Error getting IP info:', err);
        res.status(500).json({ error: 'Error obteniendo información de IP' });
    }
};
