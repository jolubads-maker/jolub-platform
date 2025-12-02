import { Router } from 'express';
import { authenticateJWT as auth } from '../middleware/auth.middleware.js';
import { adminAuth } from '../middleware/adminAuth.js';
import * as adminController from '../controllers/admin.controller.js';
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
