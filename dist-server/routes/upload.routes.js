import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
router.post('/upload', authenticateJWT, upload.single('file'), uploadImage);
export default router;
