import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Notification extends Model {
    public id!: string;
    public userId!: string;
    public title!: string;
    public body!: string;
    public data!: any;
    public isRead!: boolean;
    public type!: string;
    public deletedAt!: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Notification.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    data: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'info',
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Notification',
    paranoid: true, // Enable soft deletes
});

export default Notification;
