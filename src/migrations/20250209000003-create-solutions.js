'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Solutions', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            ticketId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Tickets',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            rootCause: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            fixSteps: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            preventionNotes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            tags: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            reuseCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT', // Don't delete user if they have solutions, or maybe SET NULL? RESTRICT is safer for attribution.
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Solutions');
    },
};
