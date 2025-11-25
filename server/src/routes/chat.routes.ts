import { Router } from 'express';
import { getUserChats, createChat, sendMessage, getChatMessages } from '../controllers/chat.controller';

const router = Router();

router.get('/users/:id/chats', getUserChats);
router.post('/chats', createChat);
router.post('/chats/:chatId/messages', sendMessage);
router.get('/chats/:chatId/messages', getChatMessages);

export default router;
