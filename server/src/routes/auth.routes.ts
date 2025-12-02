import { Router } from 'express';
import {
    syncUser,
    generateSessionToken,
    authenticateWithToken,
    sendPhoneCode,
    verifyPhoneCode,
    sendEmailCode,
    verifyEmailCode,
    getIpInfo,
    forgotPassword,
    resetPassword,
    checkEmail,

    login,
    logout
} from '../controllers/auth.controller.js';

import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, syncUserSchema, tokenSchema } from '../schemas/auth.schema.js';

const router = Router();

// User sync (login/register)
router.post('/auth/sync', validate(syncUserSchema), syncUser);
router.post('/auth/login', validate(loginSchema), login);
router.post('/auth/logout', logout);

// Session management
router.post('/users/:id/session-token', generateSessionToken);
router.post('/auth/token', validate(tokenSchema), authenticateWithToken);

// Verification
router.post('/send-phone-code', sendPhoneCode);
router.post('/verify-phone-code', verifyPhoneCode);
router.post('/send-email-code', sendEmailCode);
router.post('/verify-email-code', verifyEmailCode);

// Password Recovery
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/check-email', checkEmail);

// Utils
router.get('/get-ip-info', getIpInfo);

export default router;
