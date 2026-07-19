import { Router } from 'express';
import marketController from '../controllers/market-controller';
import authGuard from '../middleware/auth';

const router = Router();

// Secure all market metrics routes behind authGuard
router.use(authGuard);

router.get('/dashboard', marketController.getDashboard);
router.get('/sectors', marketController.getSectors);
router.get('/sectors/:name', marketController.getSectorDetails);
router.get('/scanner/:type', marketController.getScannerResults);

export default router;
