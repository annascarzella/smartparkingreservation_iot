import { Sequelize, DataTypes } from 'sequelize';
import sequelize from "../config/conn.js";

const Reservation = sequelize.define(
  'Reservation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    lock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Lock',
        key: 'id',
      },
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'lock_id', 'start_time', 'end_time'],
      },
    ],
  }
);

// `sequelize.define` also returns the model
console.log(Reservation === sequelize.models.Reservation); // true

export default Reservation;