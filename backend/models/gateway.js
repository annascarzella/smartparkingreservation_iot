import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/conn.js";
import { GatewayStatus } from "./enums.js";

const Gateway = sequelize.define(
  "Gateway",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(GatewayStatus)),
      defaultValue: "unknown",
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
    tableName: "gateway",
    schema: "smartparking",
    freezeTableName: true,
    timestamps: false, // Not adds createdAt and updatedAt fields
    indexes: [
      {
        unique: true,
        fields: ["name", "latitude", "longitude"],
      },
    ],
  }
);

// `sequelize.define` also returns the model
console.log(Gateway === sequelize.models.Gateway); // true

export default Gateway;
