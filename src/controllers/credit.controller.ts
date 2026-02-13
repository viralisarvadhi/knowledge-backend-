import { Request, Response, NextFunction } from 'express';
import { User, Coupon, sequelize } from '../models';
import { getIO } from '../config/socket';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

// Get user coupons
export const getCoupons = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const coupons = await Coupon.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
        });
        res.json(coupons);
    } catch (error) {
        next(error);
    }
};

// Convert credits to coupon
export const convertCredits = async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const CREDIT_THRESHOLD = 50;
    const COUPON_AMOUNT = 10;

    const transaction = await sequelize.transaction();

    try {
        const user = await User.findByPk(userId, { transaction });

        if (!user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        if ((user as any).totalCredits < CREDIT_THRESHOLD) {
            await transaction.rollback();
            return res.status(400).json({ message: `Insufficient credits. You need at least ${CREDIT_THRESHOLD} credits to redeem a coupon.` });
        }

        // 1. Deduct credits
        (user as any).totalCredits -= CREDIT_THRESHOLD;
        await user.save({ transaction });

        // 2. Generate random coupon code
        const code = `REWARD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // 3. Create coupon (6 months expiry)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6);

        const coupon = await Coupon.create({
            userId,
            amount: COUPON_AMOUNT,
            code,
            status: 'active',
            expiryDate,
        }, { transaction });

        await transaction.commit();

        // 4. Notify via Socket
        try {
            const socketIO = getIO();
            socketIO.to(`user_${userId}`).emit('credit_updated', {
                totalCredits: user.totalCredits,
                message: `Successfully redeemed ₹${COUPON_AMOUNT} Coupon! 🎉`,
                coupon
            });
        } catch (e) {
            console.warn('Socket notification failed', e);
        }

        res.json({
            message: `Successfully converted ${CREDIT_THRESHOLD} credits to a ₹${COUPON_AMOUNT} coupon!`,
            coupon,
            totalCredits: user.totalCredits
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};
