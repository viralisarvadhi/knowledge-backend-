import { Router } from 'express';
import {
    createTicket,
    getTickets,
    redeemTicket,
    resolveTicket,
    deleteTicket,
    resolveWithExistingSolution
} from '../controllers/ticket.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/', upload.array('attachments'), createTicket);
router.get('/', getTickets);
router.patch('/:id/redeem', redeemTicket);
router.patch('/:id/resolve', upload.array('attachments'), resolveTicket);
router.patch('/:id/resolve-with-existing', resolveWithExistingSolution);
router.delete('/:id', deleteTicket);

export default router;
