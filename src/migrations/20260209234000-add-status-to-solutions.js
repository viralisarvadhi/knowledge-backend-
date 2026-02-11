'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Solutions', 'status', {
            type: Sequelize.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Solutions', 'status');
        // Optionally drop the ENUM type in PostgreSQL if needed
        // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Solutions_status";');
    },
};
