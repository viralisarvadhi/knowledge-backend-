import { User, Solution, sequelize } from '../models';

async function resyncCredits() {
    const transaction = await sequelize.transaction();
    try {
        const users = await User.findAll({ transaction });

        console.log('Resyncing credits for all users...');

        for (const user of users) {
            // 1. Credits from approved solutions (10 per solution)
            const approvedSolutions = await Solution.findAll({
                where: { createdBy: user.id, status: 'approved' },
                transaction
            });
            const resolutionCredits = approvedSolutions.length * 10;

            // 2. Credits from reuses (5 per reuse)
            // Assuming reuseCount is only for approved solutions
            let reuseCredits = 0;
            approvedSolutions.forEach(s => {
                reuseCredits += (s.reuseCount || 0) * 5;
            });

            const correctTotal = resolutionCredits + reuseCredits;

            if (user.totalCredits !== correctTotal) {
                console.log(`- Updating user ${user.name} (${user.email}): ${user.totalCredits} -> ${correctTotal}`);
                user.totalCredits = correctTotal;
                await user.save({ transaction });
            } else {
                console.log(`- User ${user.name} (${user.email}) is already correct: ${user.totalCredits}`);
            }
        }

        await transaction.commit();
        console.log('Resync complete.');
    } catch (error) {
        await transaction.rollback();
        console.error('Resync failed:', error);
    }
}

resyncCredits();
