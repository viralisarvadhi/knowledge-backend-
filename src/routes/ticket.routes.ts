import { Router } from 'express';
import {
    createTicket,
    getTickets,
    redeemTicket,
    resolveTicket,
    deleteTicket,
    resolveWithExistingSolution,
    getTicketById
} from '../controllers/ticket.controller';
import {
    markSolutionFeasible,
    rejectSolution,
    reopenTicket
} from '../controllers/trainee.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/', upload.array('attachments'), createTicket);
router.get('/', getTickets);
router.patch('/:id/redeem', redeemTicket);
router.get('/:id', getTicketById);
router.patch('/:id/resolve', upload.array('attachments'), resolveTicket);
router.patch('/:id/resolve-with-existing', resolveWithExistingSolution);
router.delete('/:id', deleteTicket);

// Trainee Actions (Ticket Creator)
router.patch('/:ticketId/solutions/:solutionId/feasible', markSolutionFeasible);
router.patch('/:ticketId/solutions/:solutionId/reject', rejectSolution);
router.patch('/:ticketId/reopen', reopenTicket);

export default router;
