import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SolutionAttributes {
    id: string;
    ticketId: string;
    rootCause: string;
    fixSteps: string;
    preventionNotes?: string | null;
    tags?: string[] | null;
    reuseCount: number;
    createdBy: string;
    isActive: boolean;
    status: 'pending' | 'approved' | 'rejected';
    attachments: string[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

interface SolutionCreationAttributes extends Optional<SolutionAttributes, 'id' | 'preventionNotes' | 'tags' | 'reuseCount' | 'isActive' | 'status' | 'attachments' | 'createdAt' | 'updatedAt'> { }

class Solution extends Model<SolutionAttributes, SolutionCreationAttributes> implements SolutionAttributes {
    public id!: string;
    public ticketId!: string;
    public rootCause!: string;
    public fixSteps!: string;
    public preventionNotes!: string | null;
    public tags!: string[] | null;
    public reuseCount!: number;
    public createdBy!: string;
    public isActive!: boolean;
    public status!: 'pending' | 'approved' | 'rejected';
    public attachments!: string[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Solution.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        ticketId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        rootCause: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        fixSteps: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        preventionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tags: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        reuseCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
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
        modelName: 'Solution',
        tableName: 'Solutions',
        paranoid: true,
    }
);

export default Solution;
