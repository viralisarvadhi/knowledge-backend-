import { User, Ticket, Solution } from '../models';

console.log('Checking associations...');

const userAssociations = Object.keys(User.associations);
console.log('User associations:', userAssociations);

const ticketAssociations = Object.keys(Ticket.associations);
console.log('Ticket associations:', ticketAssociations);

const solutionAssociations = Object.keys(Solution.associations);
console.log('Solution associations:', solutionAssociations);

if (
    userAssociations.includes('ticketsAsTrainee') &&
    userAssociations.includes('ticketsAsRedeemer') &&
    userAssociations.includes('Solutions') &&
    ticketAssociations.includes('trainee') &&
    ticketAssociations.includes('redeemer') &&
    ticketAssociations.includes('Solution') &&
    solutionAssociations.includes('Ticket') &&
    solutionAssociations.includes('creator')
) {
    console.log('All associations verified.');
} else {
    console.error('Missing associations!');
    process.exit(1);
}
