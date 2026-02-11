import { Router } from 'express';
import { uploadAvatar, removeAvatar } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Upload avatar
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

// Remove avatar
router.delete('/avatar', authenticate, removeAvatar);

export default router;
