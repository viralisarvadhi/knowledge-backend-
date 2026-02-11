'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add deletedAt to Users
        await queryInterface.addColumn('Users', 'deletedAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        // Add deletedAt to Tickets
        await queryInterface.addColumn('Tickets', 'deletedAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        // Add deletedAt to Solutions
        await queryInterface.addColumn('Solutions', 'deletedAt', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Users', 'deletedAt');
        await queryInterface.removeColumn('Tickets', 'deletedAt');
        await queryInterface.removeColumn('Solutions', 'deletedAt');
    }
};
