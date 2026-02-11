import { Request, Response, NextFunction } from 'express';
import { DeviceToken, Notification } from '../models';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const registerToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, platform } = req.body;
        const userId = (req as AuthenticatedRequest).user!.id;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Upsert logic: If token exists, update user/platform. If not, create.
        // Actually, a token is unique to a device. If a different user logs in on same device, we should update the userId.
        const [deviceToken, created] = await DeviceToken.findOrCreate({
            where: { token },
            defaults: { userId, token, platform }
        });

        if (!created) {
            deviceToken.userId = userId;
            deviceToken.platform = platform || deviceToken.platform;
            await deviceToken.save();
        }

        res.json({ message: 'Device token registered' });
    } catch (error) {
        next(error);
    }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const { page = 1, limit = 20 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const { count, rows } = await Notification.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset,
        });

        // Count unread
        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            notifications: rows,
            total: count,
            unreadCount,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit))
        });
    } catch (error) {
        next(error);
    }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const { id } = req.params; // 'all' or simple ID

        if (id === 'all') {
            await Notification.update({ isRead: true }, {
                where: { userId, isRead: false }
            });
        } else {
            await Notification.update({ isRead: true }, {
                where: { id, userId }
            });
        }

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        await notification.destroy(); // Soft delete because paranoid: true

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
