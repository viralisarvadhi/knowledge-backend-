import { Router } from 'express';
import * as creditController from '../controllers/credit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/coupons', creditController.getCoupons as any);
router.post('/convert', creditController.convertCredits as any);

export default router;
