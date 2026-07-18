import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { registerValidator, loginValidator } from '../validators/auth.validator';

const router = Router();

router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.get('/profile', protect, AuthController.getProfile);

export default router;
