'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Tickets', 'reusedSolutionId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'Solutions',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Tickets', 'reusedSolutionId');
    },
};
