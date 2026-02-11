import { User, Ticket, Solution } from '../models';

async function inspectUserDev() {
    try {
        const allUsers = await User.findAll();
        console.log('All Users:');
        allUsers.forEach(u => console.log(`- ${u.name} (${u.email}, credits: ${u.totalCredits})`));

        const user = allUsers.find(u => u.name.toLowerCase().includes('dev')) || allUsers.find(u => u.email.toLowerCase().includes('dev'));
        if (!user) {
            console.log('User "dev" or similar matching name/email not found');
            return;
        }

        console.log('User Details:');
        console.log({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            totalCredits: user.totalCredits
        });

        const ticketsRelolved = await Ticket.findAll({
            where: { redeemedBy: user.id, status: 'resolved' },
            include: [{ model: Solution, as: 'solution' }]
        });

        console.log('\nTickets Resolved by "dev":');
        ticketsRelolved.forEach((t: any) => {
            console.log({
                id: t.id,
                title: t.title,
                status: t.status,
                solution: t.solution ? {
                    id: t.solution.id,
                    status: t.solution.status,
                    createdAt: t.solution.createdAt
                } : 'None'
            });
        });

        const solutionsCreated = await Solution.findAll({
            where: { createdBy: user.id }
        });

        console.log('\nSolutions Created by "dev":');
        solutionsCreated.forEach(s => {
            console.log({
                id: s.id,
                ticketId: s.ticketId,
                status: (s as any).status,
                createdAt: s.createdAt
            });
        });

    } catch (error) {
        console.error('Inspection failed:', error);
    }
}

inspectUserDev();
