//const { Sequelize } = require('sequelize');
//const dotenv = require('dotenv');

import { Sequelize } from "sequelize";
import { DB_URL } from "./dbUrl.js";

const sequelize = new Sequelize(DB_URL);

try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;
