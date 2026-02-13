import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CouponAttributes {
    id: string;
    userId: string;
    amount: number;
    code: string;
    status: 'active' | 'used' | 'expired';
    expiryDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface CouponCreationAttributes extends Optional<CouponAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> { }

class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
    public id!: string;
    public userId!: string;
    public amount!: number;
    public code!: string;
    public status!: 'active' | 'used' | 'expired';
    public expiryDate!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Coupon.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'used', 'expired'),
            allowNull: false,
            defaultValue: 'active',
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Coupon',
        tableName: 'Coupons',
    }
);

export default Coupon;
