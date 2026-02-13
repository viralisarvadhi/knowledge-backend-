import { Request, Response, NextFunction } from 'express';
import { Ticket } from '../models';
import { getIO } from '../config/socket';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description } = req.body;
        const traineeId = (req as AuthenticatedRequest).user!.id;
        const attachments = (req as any).files?.map((f: any) => `/uploads/${f.filename}`) || [];

        const ticket = await Ticket.create({
            title,
            description,
            traineeId,
            status: 'open',
            redeemedBy: null, // explicit null
            attachments,
        });

        try {
            getIO().emit('ticket_created', ticket);

            // Send Push Notification
            const { sendToAll } = await import('../services/notification.service');
            sendToAll(
                'New Ticket Created',
                `A new ticket "${ticket.title}" has been created.`,
                { ticketId: ticket.id, type: 'new_ticket' }
            );

        } catch (e) {
            console.warn('Socket.io or Notification service failed', e);
        }

        res.status(201).json({ message: 'Ticket created', ticket });
    } catch (error) {
        next(error);
    }
};

export const redeemTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthenticatedRequest).user!.id;
        const userRole = (req as AuthenticatedRequest).user!.role;

        // Use transaction with lock to prevent race condition
        const { sequelize } = await import('../models');
        const transaction = await sequelize.transaction();

        try {
            // Lock the ticket row for update
            const ticket = await Ticket.findByPk(id as string, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Ticket not found' });
            }

            if (ticket.status !== 'open' && ticket.status !== 'reopened') {
                await transaction.rollback();
                return res.status(400).json({ message: 'Ticket is not open for redemption' });
            }

            if (ticket.redeemedBy && ticket.redeemedBy !== userId && userRole !== 'admin') {
                await transaction.rollback();
                return res.status(403).json({ message: 'Ticket already redeemed by another user' });
            }

            // Removed check: Creator CAN redeem their own ticket now.
            // if (ticket.traineeId === userId && userRole !== 'admin') {
            //     await transaction.rollback();
            //     return res.status(403).json({ message: 'You cannot redeem your own ticket' });
            // }

            ticket.redeemedBy = userId;
            ticket.status = 'in-progress';
            await ticket.save({ transaction });

            await transaction.commit();

            try {
                getIO().emit('ticket_redeemed', ticket);
            } catch (e) {
                console.warn('Socket.io not initialized, skipping emit');
            }

            res.json({ message: 'Ticket redeemed', ticket });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const resolveTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { rootCause, fixSteps, preventionNotes, tags } = req.body;
        const userId = (req as AuthenticatedRequest).user!.id;
        const userRole = (req as AuthenticatedRequest).user!.role;

        // Use transaction for atomic solution creation and ticket update
        const { sequelize } = await import('../models');
        const transaction = await sequelize.transaction();

        try {
            const ticket = await Ticket.findByPk(id as string, { transaction });

            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Ticket not found' });
            }

            if (ticket.status === 'resolved') {
                await transaction.rollback();
                return res.status(400).json({ message: 'Ticket already resolved' });
            }

            // Only redeemer or admin can resolve
            if (ticket.redeemedBy !== userId && userRole !== 'admin') {
                await transaction.rollback();
                return res.status(403).json({ message: 'Not authorized to resolve this ticket' });
            }

            // Create solution if solution data provided
            let solution = null;
            const attachments = (req as any).files?.map((f: any) => `/uploads/${f.filename}`) || [];

            const isSelfSolved = String(ticket.traineeId) === String(userId);

            if (rootCause && fixSteps) {
                const { Solution } = await import('../models');
                solution = await Solution.create({
                    ticketId: ticket.id,
                    rootCause,
                    fixSteps,
                    preventionNotes: preventionNotes || null,
                    tags: tags || [],
                    reuseCount: 0,
                    createdBy: userId,
                    isActive: true,
                    status: isSelfSolved ? 'approved' : 'pending',
                    attachments
                }, { transaction });
            }

            if (isSelfSolved) {
                ticket.status = 'resolved';
            }
            await ticket.save({ transaction });

            await transaction.commit();

            try {
                getIO().emit('ticket_resolved', { ticket, solution });
                if (isSelfSolved) {
                    getIO().emit('ticket_updated', ticket);
                }

                // Send Push Notification to Ticket Creator (if not self-solved)
                const { sendToUser } = await import('../services/notification.service');
                if (!isSelfSolved) {
                    await sendToUser(
                        ticket.traineeId,
                        'Solution Submitted 🚀',
                        `A solution has been submitted for your ticket "${ticket.title}". Please review it.`,
                        { ticketId: ticket.id, type: 'solution_submitted' }
                    );
                }
            } catch (e) {
                console.warn('Socket.io or Notification failed', e);
            }

            const message = isSelfSolved
                ? 'Ticket resolved and solution published to Knowledge Base.'
                : 'Ticket resolved. Solution pending creator review.';

            res.json({ message, ticket, solution });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const resolveWithExistingSolution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { solutionId } = req.body;
        const userId = (req as AuthenticatedRequest).user!.id;
        const userRole = (req as AuthenticatedRequest).user!.role;

        if (!solutionId) {
            return res.status(400).json({ message: 'solutionId is required' });
        }

        const { Solution, User, sequelize } = await import('../models');
        const { awardCreditsForResolution, awardCreditsForReuse } = await import('../services/credit.service');
        const transaction = await sequelize.transaction();

        try {
            // 1. Get and lock the ticket
            const ticket = await Ticket.findByPk(id as string, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Ticket not found' });
            }

            if (ticket.status === 'resolved') {
                await transaction.rollback();
                return res.status(400).json({ message: 'Ticket already resolved' });
            }

            if (ticket.redeemedBy !== userId && userRole !== 'admin') {
                await transaction.rollback();
                return res.status(403).json({ message: 'Not authorized to resolve this ticket' });
            }

            // 2. Get and lock the solution
            const solution = await Solution.findByPk(solutionId as string, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!solution || !solution.isActive || solution.status !== 'approved') {
                await transaction.rollback();
                return res.status(400).json({ message: 'Invalid or inactive solution selected' });
            }

            // 3. Update ticket
            ticket.status = 'resolved';
            ticket.reusedSolutionId = solution.id;
            await ticket.save({ transaction });

            // 4. Increment reuse count
            solution.reuseCount += 1;
            await solution.save({ transaction });

            // 5. Award credits to redeemer (10, or 0 if self-solved)
            let redeemerAward = { creditsAwarded: 0, totalCredits: 0 };
            const isSelfSolved = ticket.traineeId === userId;

            if (isSelfSolved) {
                // Self-solved: 0 credits, and ensure ticket is resolved (already set above)
                const redeemer = await User.findByPk(userId, { transaction });
                redeemerAward = { creditsAwarded: 0, totalCredits: redeemer?.totalCredits || 0 };
            } else {
                redeemerAward = await awardCreditsForResolution(userId, userRole, transaction);
            }

            // 6. Award credits to solution creator (5, skip if solution creator is the same as redeemer who already got 0)
            let creatorAward = { creditsAwarded: 0, totalCredits: 0 };
            if (solution.createdBy === userId && isSelfSolved) {
                const creator = await User.findByPk(solution.createdBy, { transaction });
                creatorAward = { creditsAwarded: 0, totalCredits: creator?.totalCredits || 0 };
            } else {
                creatorAward = await awardCreditsForReuse(solution.createdBy, transaction);
            }

            await transaction.commit();

            // 7. Socket Notifications
            try {
                const socketIO = getIO();
                // Broadcast ticket status change
                socketIO.emit('ticket_resolved', { ticket, solution: null, reusedSolutionId: solution.id });

                // Live update for redeemer
                socketIO.to(`user_${userId}`).emit('solution_approved', {
                    solutionId: solution.id,
                    creditsAwarded: redeemerAward.creditsAwarded,
                    totalCredits: redeemerAward.totalCredits
                });

                // Live update for solution creator
                socketIO.to(`user_${solution.createdBy}`).emit('solution_approved', {
                    solutionId: solution.id,
                    creditsAwarded: creatorAward.creditsAwarded,
                    totalCredits: creatorAward.totalCredits
                });

                // Send Push Notification
                const { sendToUser } = await import('../services/notification.service');
                if (ticket.traineeId !== userId) {
                    await sendToUser(
                        ticket.traineeId,
                        'Ticket Resolved ✅',
                        `Your ticket "${ticket.title}" is now resolved. Please check the solution.`,
                        { ticketId: ticket.id, type: 'ticket_resolved' }
                    );
                }

            } catch (e) {
                console.warn('Socket.io notification failed', e);
            }

            res.json({
                message: 'Ticket resolved using existing solution. Credits awarded.',
                ticket,
                redeemerAwarded: redeemerAward.creditsAwarded,
                creatorAwarded: creatorAward.creditsAwarded
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, id } = (req as AuthenticatedRequest).user!;
        const { status } = req.query;

        const { Ticket } = await import('../models');
        const { Op } = require('sequelize'); // Import Op directly

        const where: any = {};
        if (status) {
            where.status = status;
        }

        // Logic: Return all non-deleted tickets AND deleted tickets that belong to the current user
        // We use paranoid: false to fetch everything, then filter in the WHERE clause
        const tickets = await Ticket.findAll({
            where: {
                [Op.and]: [
                    where, // apply status filter if present
                    {
                        [Op.or]: [
                            { deletedAt: null }, // Active tickets
                            { traineeId: id }    // My tickets (active or deleted)
                        ]
                    }
                ]
            },
            paranoid: false, // Include soft-deleted records
            include: [
                { association: 'trainee', attributes: ['id', 'name', 'email'] },
                { association: 'redeemer', attributes: ['id', 'name', 'email'] },
                // Use 'solutions' (plural) to get all, then we pick the latest
                {
                    association: 'solutions',
                    attributes: ['id', 'status', 'rootCause', 'fixSteps', 'preventionNotes', 'attachments', 'createdBy', 'createdAt'],
                }
            ],
            order: [
                ['createdAt', 'DESC'],
                // sort solutions by createdAt desc so solutions[0] is the latest
                [{ model: (await import('../models')).Solution, as: 'solutions' }, 'createdAt', 'DESC']
            ]
        });

        // Sanitize tickets: prevent solution data return unless approved or user is admin/owner
        const sanitizedTickets = tickets.map(t => {
            const ticket = t.toJSON() as any;

            // Set ticket.solution to the latest solution
            if (ticket.solutions && ticket.solutions.length > 0) {
                ticket.solution = ticket.solutions[0];
            }
            delete ticket.solutions; // Clean up

            if (ticket.solution && ticket.solution.status !== 'approved' && role !== 'admin' && ticket.redeemedBy !== id) {
                // If not approved, and user is not admin or the redeemer, hide details
                ticket.solution = {
                    id: ticket.solution.id,
                    status: ticket.solution.status,
                    createdBy: ticket.solution.createdBy,
                    // valid to show status, but hide content
                    rootCause: null,
                    fixSteps: null,
                    preventionNotes: null,
                    attachments: null
                };
            }
            return ticket;
        });

        res.json(sanitizedTickets);
    } catch (error) {
        next(error);
    }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userRole = (req as AuthenticatedRequest).user!.role;

        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete tickets' });
        }

        const { Ticket } = await import('../models');
        const ticket = await Ticket.findByPk(id as string);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        await ticket.destroy(); // Soft delete (sets deletedAt)

        // Reload to get the updated deletedAt timestamp
        const deletedTicket = await Ticket.findByPk(id as string, { paranoid: false });

        try {
            getIO().emit('ticket_deleted', deletedTicket);
        } catch (e) {
            console.warn('Socket.io notification failed');
        }

        res.json({ message: 'Ticket deleted', ticket: deletedTicket });
    } catch (error) {
        next(error);
    }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = (req as AuthenticatedRequest).user!;

        const { Ticket, Solution } = await import('../models');

        const t = await Ticket.findByPk(id as string, {
            paranoid: false,
            include: [
                { association: 'trainee', attributes: ['id', 'name', 'email'] },
                { association: 'redeemer', attributes: ['id', 'name', 'email'] },
                {
                    association: 'solutions',
                    attributes: ['id', 'status', 'rootCause', 'fixSteps', 'preventionNotes', 'attachments', 'createdBy', 'createdAt'],
                }
            ],
            order: [
                [{ model: Solution, as: 'solutions' }, 'createdAt', 'DESC']
            ]
        });

        if (!t) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = t.toJSON() as any;

        // Set ticket.solution to the latest solution
        if (ticket.solutions && ticket.solutions.length > 0) {
            ticket.solution = ticket.solutions[0];
        }
        delete ticket.solutions;

        // Sanitize
        if (ticket.solution && ticket.solution.status !== 'approved' && role !== 'admin' && ticket.traineeId !== userId && ticket.redeemedBy !== userId) {
            ticket.solution = {
                id: ticket.solution.id,
                status: ticket.solution.status,
                createdBy: ticket.solution.createdBy,
                rootCause: null,
                fixSteps: null,
                preventionNotes: null,
                attachments: null
            };
        }

        res.json(ticket);
    } catch (error) {
        next(error);
    }
};
