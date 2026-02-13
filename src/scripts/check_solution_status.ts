import { Solution, Ticket } from '../models';

async function checkSolution() {
    try {
        // Find tickets with title containing 'abcd'
        const tickets = await Ticket.findAll({
            where: {
                title: { [require('sequelize').Op.iLike]: '%abcd%' }
            },
            include: [{
                model: Solution,
                as: 'solutions',
                attributes: ['id', 'status', 'isActive', 'createdAt']
            }]
        });

        console.log(`Found ${tickets.length} tickets matching 'abcd'`);
        tickets.forEach(t => {
            console.log(`\nTicket: ${t.id} - "${t.title}"`);
            console.log(`Status: ${t.status}`);
            if ((t as any).solutions && (t as any).solutions.length > 0) {
                (t as any).solutions.forEach((s: any) => {
                    console.log(`  Solution ${s.id}: status=${s.status}, isActive=${s.isActive}`);
                });
            } else {
                console.log('  No solutions found');
            }
        });

        // Also check all solutions with status 'rejected'
        console.log('\n--- All Rejected Solutions ---');
        const rejectedSolutions = await Solution.findAll({
            where: { status: 'rejected' },
            include: [{
                model: Ticket,
                as: 'ticket',
                attributes: ['id', 'title', 'status']
            }]
        });
        console.log(`Found ${rejectedSolutions.length} rejected solutions`);
        rejectedSolutions.forEach(s => {
            console.log(`Solution ${s.id}: isActive=${s.isActive}, Ticket: ${(s as any).ticket?.title}`);
        });

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSolution();
