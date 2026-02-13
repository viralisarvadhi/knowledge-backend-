'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add 'rejected' to the enum
        // We wrap in a try-catch because if it already exists (e.g. re-run), it throws an error in Postgres
        try {
            await queryInterface.sequelize.query("ALTER TYPE \"enum_Tickets_status\" ADD VALUE 'rejected';");
        } catch (e) {
            if (e.original && e.original.code === '42710') {
                // duplicate object error, meaning value already exists. Safe to ignore.
                console.log("Enum value 'rejected' already exists.");
            } else {
                throw e;
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Postgres doesn't support removing values from ENUMs easily.
        // We would have to create a new enum, migrate data, drop old enum, rename new enum.
        // For this context, we can just skip down migration or leave it empty as it's a non-destructive addition.
        // Making it strictly reversible is complex and risky for data.
        console.log("Reverting 'rejected' status addition is not implemented due to Postgres enum limitations.");
    }
};
