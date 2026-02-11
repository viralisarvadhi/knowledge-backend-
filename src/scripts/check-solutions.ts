import { Solution, sequelize } from '../models';

async function verifySolutions() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const solutions = await Solution.findAll();
        console.log(`Found ${solutions.length} solutions.`);

        solutions.forEach(s => {
            console.log('--- Solution ---');
            console.log('ID:', s.id);
            console.log('Root Cause:', s.rootCause);
            console.log('Tags:', s.tags);
            console.log('Is Active:', s.isActive);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifySolutions();
