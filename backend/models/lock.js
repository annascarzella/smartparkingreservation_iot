import { Sequelize, DataTypes } from 'sequelize';
import sequelize from "../config/conn.js";

const Lock = sequelize.define(
  'Lock',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status: {
      type: DataTypes.ENUM('reserved', 'occupied', 'free', 'out_of_order'),
      defaultValue: 'free',
    },
    alarm: {
      type: DataTypes.ENUM('on', 'off'),
      defaultValue: 'off',
    },
    magnetic_sensor: {
      type: DataTypes.ENUM('on', 'off'),
      defaultValue: 'off',
    },
    gateway_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Gateway',
        key: 'id',
      },
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: 'lock',
    schema: 'smartparking',
    freezeTableName: true,
    timestamps: false, // Not adds createdAt and updatedAt fields
    indexes: [
      {
        unique: true,
        fields: ['gateway_id', 'latitude', 'longitude'],
      },
    ],
  },
);

// `sequelize.define` also returns the model
console.log(Lock === sequelize.models.Lock); // true

export default Lock;