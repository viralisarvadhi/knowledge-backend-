import { Router } from 'express';
import { searchSolutions, incrementReuseCount } from '../controllers/solution.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/search', searchSolutions);
router.patch('/:id/reuse', incrementReuseCount);

export default router;
