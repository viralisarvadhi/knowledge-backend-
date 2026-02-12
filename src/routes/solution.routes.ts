import { Router } from 'express';
import { searchSolutions, incrementReuseCount, getRecentSolutions } from '../controllers/solution.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/recent', getRecentSolutions);
router.get('/search', searchSolutions);
router.patch('/:id/reuse', incrementReuseCount);

export default router;
