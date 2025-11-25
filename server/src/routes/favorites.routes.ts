import { Router } from 'express';
import { addFavorite, removeFavorite } from '../controllers/users.controller';

const router = Router();

router.post('/', addFavorite);
router.delete('/', removeFavorite);

export default router;
