import { Router } from 'express';
import { signUpload } from '../controllers/upload.controller';

const router = Router();

router.get('/sign-upload', signUpload);

export default router;
