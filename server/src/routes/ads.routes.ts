import { Router } from 'express';
import { getAds, createAd, searchAds, incrementAdViews, featureAd, getAdByUniqueCode } from '../controllers/ads.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { adSchema, featureAdSchema } from '../schemas/ads.schema';

const router = Router();

router.get('/', getAds);
router.post('/', authenticateJWT, validate(adSchema), createAd);
router.get('/search', searchAds);
router.put('/:id/view', incrementAdViews);
router.post('/:id/feature', authenticateJWT, validate(featureAdSchema), featureAd);
router.get('/code/:uniqueCode', getAdByUniqueCode);

export default router;
