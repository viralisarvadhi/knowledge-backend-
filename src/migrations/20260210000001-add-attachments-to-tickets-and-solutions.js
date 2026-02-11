'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Tickets', 'attachments', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
        });
        await queryInterface.addColumn('Solutions', 'attachments', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Tickets', 'attachments');
        await queryInterface.removeColumn('Solutions', 'attachments');
    },
};
