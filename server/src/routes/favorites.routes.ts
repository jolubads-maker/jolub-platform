import { Router } from 'express';
import { addFavorite, removeFavorite } from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { addFavoriteSchema, removeFavoriteSchema } from '../schemas/favorites.schema.js';

const router = Router();

router.post('/', authenticateJWT, validate(addFavoriteSchema), addFavorite);
router.delete('/', authenticateJWT, validate(removeFavoriteSchema), removeFavorite);

export default router;
