import { Sequelize, DataTypes } from 'sequelize';
import sequelize from "../config/conn.js";

const Users = sequelize.define(
  'Users',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  },
  {
    tableName: 'users',
    schema: 'smartparking',
    freezeTableName: true,
    timestamps: false, // Not adds createdAt and updatedAt fields
  },
);

// `sequelize.define` also returns the model
console.log(Users === sequelize.models.Users); // true

export default Users;