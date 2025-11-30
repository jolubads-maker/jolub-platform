import { Router } from 'express';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require authentication and admin role
router.use(auth, adminAuth);

router.get('/stats', adminController.getStats);
router.get('/revenue', adminController.getRevenue);
router.get('/users', adminController.getUsers);
router.get('/ads', adminController.getAds);
router.delete('/ads/:id', adminController.deleteAd);
router.put('/users/:id/ban', adminController.toggleUserBan);

export default router;
