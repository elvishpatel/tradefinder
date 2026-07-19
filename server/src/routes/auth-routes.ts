import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth-controller';
import authGuard from '../middleware/auth';
import validateRequest from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest,
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  authController.login
);

// Protected App Auth Routes
router.get('/me', authGuard, authController.me);

// Fyers Integration Routes
router.get('/fyers/url', authGuard, authController.getFyersUrl);
router.get('/fyers/session', authGuard, authController.getFyersSession);
router.post('/fyers/disconnect', authGuard, authController.disconnectFyers);

// Public Fyers OAuth Callback (invoked by FYERS authorization server redirect)
router.get('/fyers/callback', authController.fyersCallback);

export default router;
