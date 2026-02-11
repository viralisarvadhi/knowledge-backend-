import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
    id: string;
    name: string;
    email: string;
    role: 'trainee' | 'admin';
    password?: string;
    totalCredits: number;
    avatar?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'totalCredits' | 'createdAt' | 'updatedAt'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public name!: string;
    public email!: string;
    public role!: 'trainee' | 'admin';
    public password!: string;
    public totalCredits!: number;
    public avatar!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        role: {
            type: DataTypes.ENUM('trainee', 'admin'),
            allowNull: false,
            defaultValue: 'trainee',
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        totalCredits: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        paranoid: true,
    }
);

export default User;
