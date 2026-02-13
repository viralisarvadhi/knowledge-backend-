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
        const rejected = await Ticket.count({ where: { status: 'rejected' } });
        const reopened = await Ticket.count({ where: { status: 'reopened' } });

        res.json({
            totalTickets,
            open,
            inProgress,
            resolved,
            rejected,
            reopened
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
        const { Op } = require('sequelize');
        const solutions = await Solution.findAll({
            where: {
                status: {
                    [Op.in]: ['pending', 'rejected']
                }
            },
            include: [
                { association: 'ticket', attributes: ['id', 'title', 'description', 'status'] },
                { association: 'creator', attributes: ['id', 'name', 'email'] }
            ],
            order: [['updatedAt', 'DESC']]
        });
        res.json(solutions);
    } catch (error) {
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
