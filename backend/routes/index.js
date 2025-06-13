import express from "express";
import loginRouter from "./login.js";
import registrationRouter from "./registration.js";
import middleware from "../middleware/middleware.js";
import fetchRouter from "./fetch.js";
import arrivalRouter from "./arrival.js";
import reservationRouter from "./reservation.js";

export const router = express.Router();
export const authRouter = express.Router();

authRouter.use("/login", loginRouter);
authRouter.use("/register", registrationRouter);

router.use(middleware);

router.use("/fetch", fetchRouter);
router.use("/arrival", arrivalRouter);
router.use("/reservation", reservationRouter);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
