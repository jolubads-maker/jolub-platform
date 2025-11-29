import { Router } from 'express';
import {
    getUsers,
    checkUsername,
    checkEmail,
    updateOnlineStatus,
    updateAvatar,
    verifyUserPhone,
    getUserFavorites,
    updatePrivacy,
    rateUser,
    getUserById
} from '../controllers/users.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
    updateUserStatusSchema,
    updateAvatarSchema,
    verifyPhoneSchema,
    updatePrivacySchema,
    rateUserSchema
} from '../schemas/users.schema';

const router = Router();

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/check-username', checkUsername);
router.get('/check-email', checkEmail);
router.put('/users/:id/online-status', authenticateJWT, validate(updateUserStatusSchema), updateOnlineStatus);
router.put('/users/:id/avatar', authenticateJWT, validate(updateAvatarSchema), updateAvatar);
router.put('/users/:id/verify-phone', authenticateJWT, validate(verifyPhoneSchema), verifyUserPhone);
router.put('/users/:id/privacy', authenticateJWT, validate(updatePrivacySchema), updatePrivacy);
router.post('/users/:id/rate', authenticateJWT, validate(rateUserSchema), rateUser);
router.get('/users/:userId/favorites', getUserFavorites);

export default router;
