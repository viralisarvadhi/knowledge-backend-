import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class DeviceToken extends Model {
    public id!: string;
    public userId!: string;
    public token!: string;
    public platform!: string;
}

DeviceToken.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    platform: {
        type: DataTypes.ENUM('ios', 'android', 'web'),
        defaultValue: 'android',
    },
}, {
    sequelize,
    modelName: 'DeviceToken',
});

export default DeviceToken;
