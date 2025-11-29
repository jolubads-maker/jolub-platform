import { Router } from 'express';
import { addFavorite, removeFavorite } from '../controllers/users.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { addFavoriteSchema, removeFavoriteSchema } from '../schemas/favorites.schema';

const router = Router();

router.post('/', authenticateJWT, validate(addFavoriteSchema), addFavorite);
router.delete('/', authenticateJWT, validate(removeFavoriteSchema), removeFavorite);

export default router;
