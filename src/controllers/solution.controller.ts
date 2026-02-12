import { Request, Response, NextFunction } from 'express';
import { Solution, Ticket, sequelize } from '../models';
import { Op } from 'sequelize';
import { getIO } from '../config/socket';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const searchSolutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query required' });
        }

        const solutions = await Solution.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { rootCause: { [Op.iLike]: `%${q}%` } },
                    { fixSteps: { [Op.iLike]: `%${q}%` } },
                    { preventionNotes: { [Op.iLike]: `%${q}%` } },
                    sequelize.where(
                        sequelize.cast(sequelize.col('Solution.tags'), 'text'),
                        { [Op.iLike]: `%${q}%` }
                    ),
                    { '$ticket.title$': { [Op.iLike]: `%${q}%` } },
                    { '$ticket.description$': { [Op.iLike]: `%${q}%` } }
                ]
            },
            include: [
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['id', 'title', 'description', 'attachments'],
                }
            ],
            subQuery: false
        });

        res.json({ solutions });
    } catch (error) {
        next(error);
    }
};

export const getRecentSolutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const solutions = await Solution.findAll({
            where: {
                isActive: true,
            },
            include: [
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['id', 'title', 'description', 'attachments'],
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
        });

        res.json(solutions);
    } catch (error) {
        next(error);
    }
};

export const incrementReuseCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthenticatedRequest).user!.id;

        const solution = await Solution.findByPk(id as string);

        if (!solution) {
            return res.status(404).json({ message: 'Solution not found' });
        }

        if (!solution.isActive) {
            return res.status(400).json({ message: 'Solution is not active' });
        }

        solution.reuseCount += 1;
        await solution.save();

        // Award credits to solution creator
        let creditsAwarded = 0;
        let totalCredits = 0;
        try {
            const { awardCreditsForReuse } = await import('../services/credit.service');
            const result = await awardCreditsForReuse(solution.createdBy);
            creditsAwarded = result.creditsAwarded;
            totalCredits = result.totalCredits;
        } catch (error) {
            console.error('Failed to award credits:', error);
        }

        try {
            const socketIO = getIO();
            // Broadcast the reuse event
            socketIO.emit('solution_reused', { solution, userId });

            // Notify the creator about the credits update directly
            if (totalCredits > 0) {
                socketIO.to(`user_${solution.createdBy}`).emit('solution_approved', {
                    solutionId: solution.id,
                    creditsAwarded,
                    totalCredits
                });
            }
        } catch (e) {
            console.warn('Socket.io not initialized, skipping emit');
        }

        res.json({ message: 'Solution reuse count incremented', solution, creditsAwarded });
    } catch (error) {
        next(error);
    }
};
