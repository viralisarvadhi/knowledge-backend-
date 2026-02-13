import { Ticket, Solution } from '../models';

async function checkLogicErrorTicket() {
    try {
        // Find ticket with title "Logic error"
        const ticket = await Ticket.findOne({
            where: {
                title: { [require('sequelize').Op.iLike]: '%logic error%' }
            },
            include: [{
                model: Solution,
                as: 'solution',
                attributes: ['id', 'status', 'attachments', 'rootCause', 'fixSteps']
            }]
        });

        if (!ticket) {
            console.log('Ticket "Logic error" not found');
            return;
        }

        console.log(`\nTicket: ${ticket.title}`);
        console.log(`Ticket ID: ${ticket.id}`);
        console.log(`Ticket Status: ${ticket.status}`);

        if ((ticket as any).solution) {
            const sol = (ticket as any).solution;
            console.log(`\nSolution ID: ${sol.id}`);
            console.log(`Solution Status: ${sol.status}`);
            console.log(`Solution Attachments:`, sol.attachments);
            console.log(`Attachments count: ${sol.attachments?.length || 0}`);
        } else {
            console.log('No solution found for this ticket');
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkLogicErrorTicket();
