import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TicketAttributes {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved';
    traineeId: string;
    redeemedBy?: string | null;
    reusedSolutionId?: string | null;
    attachments: string[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'status' | 'redeemedBy' | 'reusedSolutionId' | 'attachments' | 'createdAt' | 'updatedAt'> { }

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
    public id!: string;
    public title!: string;
    public description!: string;
    public status!: 'open' | 'in-progress' | 'resolved';
    public traineeId!: string;
    public redeemedBy!: string | null;
    public reusedSolutionId!: string | null;
    public attachments!: string[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Ticket.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('open', 'in-progress', 'resolved'),
            allowNull: false,
            defaultValue: 'open',
        },
        traineeId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        redeemedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        attachments: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Ticket',
        tableName: 'Tickets',
        paranoid: true,
    }
);

export default Ticket;
