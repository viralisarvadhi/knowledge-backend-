import { Ticket, User, Solution } from '../models';
import { Op } from 'sequelize';

async function checkUserTickets() {
    try {
        const tickets = await Ticket.findAll({
            include: [{
                model: Solution,
                as: 'solution',
                attributes: ['id', 'status', 'createdBy']
            }],
            order: [['createdAt', 'DESC']]
        });

        console.log('Current Tickets Status Report:');
        console.log('------------------------------');

        for (const ticket of tickets) {
            const sol = (ticket as any).solution;
            const isSelfSolved = ticket.traineeId === sol?.createdBy;

            console.log(`Title: ${ticket.title}`);
            console.log(`ID: ${ticket.id}`);
            console.log(`Status: ${ticket.status}`);
            console.log(`TraineeID: ${ticket.traineeId}`);
            console.log(`RedeemedBy: ${ticket.redeemedBy}`);

            if (sol) {
                console.log(`Solution Status: ${sol.status}`);
                console.log(`Solution CreatedBy: ${sol.createdBy}`);
                console.log(`Is Self Solved: ${isSelfSolved}`);
            } else {
                console.log('No solution found.');
            }
            console.log('------------------------------');
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkUserTickets();
