import sequelize from '../config/database';
import User from './User';
import Ticket from './Ticket';
import Solution from './Solution';
import DeviceToken from './DeviceToken';
import Notification from './Notification';

// User <-> Ticket (Trainee)
User.hasMany(Ticket, { as: 'ticketsAsTrainee', foreignKey: 'traineeId' });
Ticket.belongsTo(User, { as: 'trainee', foreignKey: 'traineeId' });

// User <-> Ticket (Redeemer/Admin)
User.hasMany(Ticket, { as: 'ticketsAsRedeemer', foreignKey: 'redeemedBy' });
Ticket.belongsTo(User, { as: 'redeemer', foreignKey: 'redeemedBy' });

// Ticket <-> Solution
Ticket.hasMany(Solution, { as: 'solutions', foreignKey: 'ticketId' });
Ticket.hasOne(Solution, { as: 'solution', foreignKey: 'ticketId' });
Solution.belongsTo(Ticket, { as: 'ticket', foreignKey: 'ticketId' });

Ticket.belongsTo(Solution, { as: 'reusedSolution', foreignKey: 'reusedSolutionId' });

// User <-> Solution (Creator)
User.hasMany(Solution, { foreignKey: 'createdBy' });
Solution.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// User <-> DeviceToken
User.hasMany(DeviceToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
DeviceToken.belongsTo(User, { foreignKey: 'userId' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

export {
    sequelize,
    User,
    Ticket,
    Solution,
    DeviceToken,
    Notification,
};
