import { Router } from 'express';
import {
    syncUser,
    generateSessionToken,
    authenticateWithToken,
    sendPhoneCode,
    verifyPhoneCode,
    sendEmailCode,
    verifyEmailCode,
    getIpInfo
} from '../controllers/auth.controller';

const router = Router();

// User sync (login/register)
router.post('/users', syncUser); // Was POST /api/users

// Session management
router.post('/users/:id/session-token', generateSessionToken); // Was POST /api/users/:id/session-token
router.post('/auth/token', authenticateWithToken); // Was POST /api/auth/token

// Verification
router.post('/send-phone-code', sendPhoneCode);
router.post('/verify-phone-code', verifyPhoneCode);
router.post('/send-email-code', sendEmailCode);
router.post('/verify-email-code', verifyEmailCode);

// Utils
router.get('/get-ip-info', getIpInfo);

export default router;
