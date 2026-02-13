
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Tickets_status" ADD VALUE 'reopened';
      `);
        } catch (e) {
            if (e.original && e.original.code === '42710') {
                // value already exists, ignore
                console.log('Value "reopened" already exists in enum_Tickets_status');
            } else {
                throw e;
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Removing enum value is not trivial in Postgres, usually ignored in down
        // or requires creating new type, altering column, and dropping old type.
    }
};
