import { Solution } from '../models';

async function fixRejectedSolutions() {
    try {
        // Update all rejected solutions to set isActive=false
        const result = await Solution.update(
            { isActive: false },
            { where: { status: 'rejected' } }
        );

        console.log(`Updated ${result[0]} rejected solutions to isActive=false`);

        // Verify
        const rejectedActive = await Solution.count({
            where: { status: 'rejected', isActive: true }
        });
        console.log(`Remaining rejected solutions with isActive=true: ${rejectedActive}`);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

fixRejectedSolutions();
