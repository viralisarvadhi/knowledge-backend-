import { User } from '../models';
import { sequelize } from '../models';

// Credit amounts
const CREDITS_FOR_RESOLUTION = 10;
const CREDITS_FOR_SOLUTION_REUSE = 5;

export const awardCreditsForResolution = async (userId: string, userRole: string, externalTransaction?: any) => {
    // Admin resolutions don't earn credits
    if (userRole === 'admin') {
        return { creditsAwarded: 0, totalCredits: 0 };
    }

    const transaction = externalTransaction || await sequelize.transaction();

    try {
        const user = await User.findByPk(userId, { transaction });

        if (!user) {
            if (!externalTransaction) await transaction.rollback();
            throw new Error('User not found');
        }

        user.totalCredits += CREDITS_FOR_RESOLUTION;
        await user.save({ transaction });

        const totalCredits = user.totalCredits;
        if (!externalTransaction) await transaction.commit();

        return { creditsAwarded: CREDITS_FOR_RESOLUTION, totalCredits };
    } catch (error) {
        if (!externalTransaction) await transaction.rollback();
        throw error;
    }
};

export const awardCreditsForReuse = async (solutionCreatorId: string, externalTransaction?: any) => {
    const transaction = externalTransaction || await sequelize.transaction();

    try {
        const user = await User.findByPk(solutionCreatorId, { transaction });

        if (!user) {
            if (!externalTransaction) await transaction.rollback();
            throw new Error('Solution creator not found');
        }

        user.totalCredits += CREDITS_FOR_SOLUTION_REUSE;
        await user.save({ transaction });

        const totalCredits = user.totalCredits;
        if (!externalTransaction) await transaction.commit();

        return { creditsAwarded: CREDITS_FOR_SOLUTION_REUSE, totalCredits };
    } catch (error) {
        if (!externalTransaction) await transaction.rollback();
        throw error;
    }
};
