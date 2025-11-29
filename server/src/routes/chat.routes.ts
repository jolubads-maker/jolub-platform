import { Router } from 'express';
import { getUserChats, createChat, sendMessage, getChatMessages } from '../controllers/chat.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { chatSchema, messageSchema } from '../schemas/chat.schema';

const router = Router();

router.get('/users/:id/chats', authenticateJWT, getUserChats);
router.post('/chats', authenticateJWT, validate(chatSchema), createChat);
router.post('/chats/:chatId/messages', authenticateJWT, validate(messageSchema), sendMessage);
router.get('/chats/:chatId/messages', authenticateJWT, getChatMessages);

export default router;
