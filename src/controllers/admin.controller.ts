import { Request, Response, NextFunction } from 'express';
import { User, Ticket, sequelize } from '../models';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.findAll({
            attributes: [
                'id',
                'name',
                'email',
                'role',
                'totalCredits',
                'createdAt',
                [sequelize.literal('(SELECT COUNT(*) FROM "Tickets" WHERE "Tickets"."traineeId" = "User"."id")'), 'ticketsCreated'],
                [sequelize.literal('(SELECT COUNT(*) FROM "Tickets" WHERE "Tickets"."redeemedBy" = "User"."id" AND "Tickets"."status" = \'resolved\')'), 'ticketsResolved']
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalUsers = await User.count();
        const trainees = await User.count({ where: { role: 'trainee' } });
        const admins = await User.count({ where: { role: 'admin' } });

        res.json({
            totalUsers,
            trainees,
            admins
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalTickets = await Ticket.count();
        const open = await Ticket.count({ where: { status: 'open' } });
        const inProgress = await Ticket.count({ where: { status: 'in-progress' } });
        const resolved = await Ticket.count({ where: { status: 'resolved' } });

        res.json({
            totalTickets,
            open,
            inProgress,
            resolved
        });
    } catch (error) {
        next(error);
    }
};

export const disableSolution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { Solution } = await import('../models');

        const solution = await Solution.findByPk(id as string);
        if (!solution) {
            return res.status(404).json({ message: 'Solution not found' });
        }

        solution.isActive = false;
        await solution.save();

        res.json({ message: 'Solution disabled', solution });
    } catch (error) {
        next(error);
    }
};

export const getPendingSolutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { Solution } = await import('../models');
        const solutions = await Solution.findAll({
            where: { status: 'pending' },
            include: [
                { association: 'ticket', attributes: ['id', 'title', 'description'] },
                { association: 'creator', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'ASC']]
        });
        res.json(solutions);
    } catch (error) {
        next(error);
    }
};

export const approveSolution = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { Solution, Ticket, User, sequelize } = await import('../models');
    const { awardCreditsForResolution } = (await import('../services/credit.service')) as any;

    const transaction = await sequelize.transaction();

    try {
        // Lock the solution row for update
        const solution = await Solution.findByPk(id as string, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (!solution) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Solution not found' });
        }

        if (solution.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ message: `Solution is already ${solution.status}` });
        }

        // 1. Update solution status
        solution.status = 'approved';
        await solution.save({ transaction });

        // Update ticket status to resolved
        const ticket = await Ticket.findByPk(solution.ticketId, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (ticket) {
            ticket.status = 'resolved';
            await ticket.save({ transaction });
        }

        // 2. Award credits to the creator
        const creator = await User.findByPk(solution.createdBy, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        let creditsAwarded = 0;
        let totalCredits = creator?.totalCredits || 0;

        if (creator) {
            // Pass the transaction to ensure atomicity
            const result = await awardCreditsForResolution(creator.id, creator.role, transaction);
            creditsAwarded = result.creditsAwarded;
            totalCredits = result.totalCredits;
        }

        await transaction.commit();

        // 3. Notify the user via socket (after commit)
        if (creator) {
            try {
                const { getIO } = await import('../config/socket');
                getIO().to(`user_${creator.id}`).emit('solution_approved', {
                    solutionId: solution.id,
                    creditsAwarded,
                    totalCredits,
                    ticket // Send ticket to update status
                });
                getIO().emit('ticket_updated', ticket); // Broadcast status change
            } catch (error) {
                console.warn('Failed to emit solution_approved socket event');
            }
        }

        res.json({ message: 'Solution approved and credits awarded', solution, creditsAwarded });
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};

export const rejectSolution = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { Solution, Ticket, sequelize } = await import('../models');

    const transaction = await sequelize.transaction();

    try {
        const solution = await Solution.findByPk(id as string, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (!solution) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Solution not found' });
        }

        if (solution.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ message: `Solution is already ${solution.status}` });
        }

        // 1. Update solution status
        solution.status = 'rejected';
        await solution.save({ transaction });

        // 2. Revert ticket to open status
        const ticket = await Ticket.findByPk(solution.ticketId, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (ticket) {
            ticket.status = 'open';
            ticket.redeemedBy = null;
            await ticket.save({ transaction });
        }

        await transaction.commit();

        // 3. Notify via socket
        try {
            const { getIO } = await import('../config/socket');
            getIO().emit('ticket_reopened', ticket);
        } catch (e) {
            console.warn('Socket.io notification failed for ticket_reopened');
        }

        res.json({ message: 'Solution rejected and ticket reopened', solution });
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { User, Solution, Ticket, sequelize } = await import('../models');

    const transaction = await sequelize.transaction();

    try {
        const user = await User.findByPk(id as string, { transaction });
        if (!user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Soft delete all Solutions created by the user
        await Solution.destroy({
            where: { createdBy: id },
            transaction
        });

        // 2. Soft delete all Tickets created by the user
        await Ticket.destroy({
            where: { traineeId: id },
            transaction
        });

        // 3. Unassign Tickets redeemed by the user (keep them open)
        await Ticket.update(
            { redeemedBy: null },
            {
                where: { redeemedBy: id },
                transaction
            }
        );

        // 4. Soft delete the User
        await user.destroy({ transaction });

        await transaction.commit();
        res.json({ message: 'User and associated data deleted successfully' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};
