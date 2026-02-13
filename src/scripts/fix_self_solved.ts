import { Ticket, Solution } from '../models';

async function fixSelfSolvedTickets() {
    try {
        const tickets = await Ticket.findAll({
            where: { status: 'in-progress' },
            include: [{
                model: Solution,
                as: 'solution',
                where: { status: 'pending' }
            }]
        });

        console.log(`Found ${tickets.length} potentially stuck self-solved tickets.`);

        let fixedCount = 0;
        for (const ticket of tickets) {
            const sol = (ticket as any).solution;
            if (ticket.traineeId === sol.createdBy) {
                console.log(`Fixing self-solved ticket: ${ticket.title} (${ticket.id})`);

                sol.status = 'approved';
                await sol.save();

                ticket.status = 'resolved';
                await ticket.save();

                fixedCount++;
            }
        }

        console.log(`Successfully fixed ${fixedCount} self-solved tickets.`);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

fixSelfSolvedTickets();
