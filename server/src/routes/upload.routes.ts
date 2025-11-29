import { Router } from 'express';
import { signUpload } from '../controllers/upload.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/sign-upload', authenticateJWT, signUpload);

export default router;
