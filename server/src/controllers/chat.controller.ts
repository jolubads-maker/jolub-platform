import { Request, Response } from 'express';
import prisma from '../database';

export const getUserChats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const chats = await prisma.chatParticipant.findMany({
            where: { userId: Number(id) },
            include: {
                chat: {
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true,
                                        isOnline: true,
                                        lastSeen: true
                                    }
                                }
                            }
                        },
                        ad: {
                            select: {
                                id: true,
                                uniqueCode: true,
                                title: true,
                                price: true,
                                media: {
                                    take: 1,
                                    select: { url: true, type: true }
                                }
                            }
                        },
                        messages: {
                            select: {
                                id: true,
                                text: true,
                                sender: true,
                                userId: true,
                                createdAt: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true
                                    }
                                }
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            },
            orderBy: {
                chat: {
                    updatedAt: 'desc'
                }
            },
            take: 50
        });
        res.json(chats);
    } catch (err) {
        console.error('Error getting chats:', err);
        res.status(500).json({ error: 'Error getting chats' });
    }
};

export const createChat = async (req: Request, res: Response) => {
    try {
        const { participantIds, adId, checkOnly } = req.body;
        console.log('createChat body:', req.body);
        if (!participantIds || participantIds.length !== 2) {
            return res.status(400).json({ error: 'Se requieren exactamente 2 participantes' });
        }

        const sortedIds = participantIds.sort();
        const chatId = sortedIds.join('-');

        let chat = await prisma.chatLog.findUnique({
            where: { id: chatId },
            include: {
                participants: { include: { user: true } },
                messages: { include: { user: true }, orderBy: { createdAt: 'asc' } },
                ad: { include: { media: { take: 1 } } }
            }
        });

        if (checkOnly) {
            return res.json(chat); // Returns null if not found
        }

        if (!chat) {
            chat = await prisma.chatLog.create({
                data: {
                    id: chatId,
                    adId: adId ? Number(adId) : undefined,
                    participants: {
                        create: sortedIds.map((userId: any) => ({ userId: Number(userId) }))
                    }
                },
                include: {
                    participants: { include: { user: true } },
                    messages: { include: { user: true }, orderBy: { createdAt: 'asc' } },
                    ad: { include: { media: { take: 1 } } }
                }
            });
        } else if (adId) {
            // Update the ad context if a new adId is provided
            chat = await prisma.chatLog.update({
                where: { id: chatId },
                data: { adId: Number(adId) },
                include: {
                    participants: { include: { user: true } },
                    messages: { include: { user: true }, orderBy: { createdAt: 'asc' } },
                    ad: { include: { media: { take: 1 } } }
                }
            });
        }

        res.json(chat);
    } catch (err) {
        console.error('Error creating chat:', err);
        res.status(500).json({ error: 'Error creating chat' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { userId, text, sender } = req.body;

        if (!userId || !text || !sender) {
            return res.status(400).json({ error: 'Datos del mensaje incompletos' });
        }

        const message = await prisma.message.create({
            data: {
                chatId,
                userId: Number(userId),
                text,
                sender
            },
            include: { user: true }
        });

        // Update chat updatedAt
        await prisma.chatLog.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        res.json(message);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Error sending message' });
    }
};

export const getChatMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const messages = await prisma.message.findMany({
            where: { chatId },
            include: { user: true },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (err) {
        console.error('Error getting messages:', err);
        res.status(500).json({ error: 'Error getting messages' });
    }
};
