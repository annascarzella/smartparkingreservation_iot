import express from "express";
import createError from "http-errors";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import mqttClient from "./mqttClient.js";
import sequelize from "./config/conn.js";

import { router, authRouter } from "./routes/index.js";
import cors from "cors";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { PORT } from "./config/port.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

mqttClient(); // Avvia MQTT client

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))

app.use("/", authRouter);
app.use("/", router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

// Start the server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
