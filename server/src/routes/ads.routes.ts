import { Router } from 'express';
import { getAds, createAd, searchAds, incrementAdViews, featureAd } from '../controllers/ads.controller';
import { validate, adSchema } from '../utils/validation';

const router = Router();

router.get('/', getAds);
router.post('/', validate(adSchema), createAd);
router.get('/search', searchAds);
router.put('/:id/view', incrementAdViews);
router.post('/:id/feature', featureAd);

export default router;
