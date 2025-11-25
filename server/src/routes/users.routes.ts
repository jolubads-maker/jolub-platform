import { Router } from 'express';
import {
    getUsers,
    checkUsername,
    checkEmail,
    updateOnlineStatus,
    updateAvatar,
    verifyUserPhone,
    getUserFavorites
} from '../controllers/users.controller';
import { validate, userSchema } from '../utils/validation';

const router = Router();

router.get('/users', getUsers);
router.get('/check-username', checkUsername);
router.get('/check-email', checkEmail);
router.put('/users/:id/online-status', updateOnlineStatus);
router.put('/users/:id/avatar', validate(userSchema.pick({ avatar: true })), updateAvatar);
router.put('/users/:id/verify-phone', verifyUserPhone);
router.get('/users/:userId/favorites', getUserFavorites);

export default router;
