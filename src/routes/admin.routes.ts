import { Router } from 'express';
import {
    getUserStats,
    getTicketStats,
    disableSolution,
    getUsers,
    getPendingSolutions,
    approveSolution,
    rejectSolution,
    deleteUser
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/users', getUsers);
router.get('/users/stats', getUserStats);
router.delete('/users/:id', deleteUser);
router.get('/tickets/stats', getTicketStats);
router.get('/solutions/pending', getPendingSolutions);
router.patch('/solutions/:id/approve', approveSolution);
router.patch('/solutions/:id/reject', rejectSolution);
router.patch('/solutions/:id/disable', disableSolution);

export default router;
