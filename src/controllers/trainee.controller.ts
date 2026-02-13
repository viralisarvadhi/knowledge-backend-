import { Request, Response, NextFunction } from 'express';
import { Ticket, Solution, User, sequelize } from '../models';
import { awardCreditsForResolution } from '../services/credit.service';
import { sendToUser } from '../services/notification.service';
import { getIO } from '../config/socket';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

// Mark solution as Feasible (Approved)
export const markSolutionFeasible = async (req: Request, res: Response, next: NextFunction) => {
    const ticketId = req.params.ticketId as string;
    const solutionId = req.params.solutionId as string;
    const userId = (req as AuthenticatedRequest).user!.id; // Ticket Creator

    const transaction = await sequelize.transaction();

    try {
        const ticket = await Ticket.findByPk(ticketId, { transaction });
        const solution = await Solution.findByPk(solutionId, { transaction });

        if (!ticket || !solution) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Ticket or Solution not found' });
        }

        // Authorization: Only Ticket Creator can mark feasible
        if (ticket.traineeId !== userId) {
            await transaction.rollback();
            return res.status(403).json({ message: 'Only the ticket creator can mark this as feasible' });
        }

        // Validation
        if (solution.ticketId !== ticketId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Solution does not belong to this ticket' });
        }

        if (solution.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ message: `Solution is already ${solution.status}` });
        }

        // 1. Update Statuses
        solution.status = 'approved';
        await solution.save({ transaction });

        ticket.status = 'resolved';
        await ticket.save({ transaction });

        // 2. Award Credits (Logic: 10 credits, 0 if self-solved)
        const solver = await User.findByPk(solution.createdBy, { transaction });
        let creditsAwarded = 0;
        let totalCredits = solver?.totalCredits || 0;

        if (solver) {
            if (ticket.traineeId === solution.createdBy) {
                // Self-solved: 0 credits
                creditsAwarded = 0;
            } else {
                // Award 10 credits
                const result = await awardCreditsForResolution(solver.id, solver.role, transaction);
                creditsAwarded = result.creditsAwarded;
                totalCredits = result.totalCredits;
            }
        }

        await transaction.commit();

        // 3. Notifications
        try {
            const socketIO = getIO();

            // Notify Solver
            if (solver) {
                const rewardMsg = creditsAwarded > 0
                    ? `Your solution found Feasible! You earned +${creditsAwarded} Coins! 🌟`
                    : `Your solution found Feasible! (No coins for self-solved tickets)`;

                socketIO.to(`user_${solver.id}`).emit('solution_approved', {
                    solutionId: solution.id,
                    creditsAwarded,
                    totalCredits,
                    ticket
                });

                await sendToUser(solver.id, 'Solution Accepted! ✅', rewardMsg, { ticketId, type: 'solution_approved' });
            }

            // Broadcast update
            socketIO.emit('ticket_updated', ticket);

        } catch (e) {
            console.warn('Notification failed', e);
        }

        res.json({ message: 'Solution marked as feasible', creditsAwarded });
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};

// Reject Solution
export const rejectSolution = async (req: Request, res: Response, next: NextFunction) => {
    const ticketId = req.params.ticketId as string;
    const solutionId = req.params.solutionId as string;
    const userId = (req as AuthenticatedRequest).user!.id; // Ticket Creator

    const transaction = await sequelize.transaction();

    try {
        const ticket = await Ticket.findByPk(ticketId, { transaction });
        const solution = await Solution.findByPk(solutionId, { transaction });

        if (!ticket || !solution) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Ticket or Solution not found' });
        }

        if (ticket.traineeId !== userId) {
            await transaction.rollback();
            return res.status(403).json({ message: 'Only the ticket creator can reject this solution' });
        }

        if (solution.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ message: `Solution is already ${solution.status}` });
        }

        // 1. Update Statuses
        solution.status = 'rejected';
        solution.isActive = false; // Hide from knowledge base
        await solution.save({ transaction });

        ticket.status = 'rejected'; // Ticket is considered failed/closed
        await ticket.save({ transaction });

        await transaction.commit();

        // 2. Notifications
        try {
            const socketIO = getIO();

            // Notify Solver
            const msg = `Your solution for "${ticket.title}" was rejected as Not Feasible. ❌`;
            socketIO.to(`user_${solution.createdBy}`).emit('solution_rejected', { ticket, solution });
            await sendToUser(solution.createdBy, 'Solution Rejected', msg, { ticketId, type: 'solution_rejected' });

            // Broadcast update
            socketIO.emit('ticket_updated', ticket);

        } catch (e) {
            console.warn('Notification failed', e);
        }

        res.json({ message: 'Solution rejected' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};

// Re-open Ticket (Re-generate)
export const reopenTicket = async (req: Request, res: Response, next: NextFunction) => {
    const ticketId = req.params.ticketId as string;
    const userId = (req as AuthenticatedRequest).user!.id; // Ticket Creator

    const transaction = await sequelize.transaction();

    try {
        const ticket = await Ticket.findByPk(ticketId, { transaction });

        if (!ticket) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.traineeId !== userId) {
            await transaction.rollback();
            return res.status(403).json({ message: 'Only the ticket creator can re-open this ticket' });
        }

        if (ticket.status !== 'rejected') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Only rejected tickets can be re-opened' });
        }

        // 1. Reset Ticket
        ticket.status = 'reopened';
        ticket.redeemedBy = null;
        await ticket.save({ transaction });

        await transaction.commit();

        // 2. Notifications
        try {
            const socketIO = getIO();
            socketIO.emit('ticket_reopened', ticket); // Notify everyone ticket is available again
        } catch (e) {
            console.warn('Notification failed', e);
        }

        res.json({ message: 'Ticket re-opened successfully', ticket });
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};
