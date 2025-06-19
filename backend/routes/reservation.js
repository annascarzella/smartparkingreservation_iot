import express from "express";
import {
  addReservation,
  extendReservation,
  getCurrentReservation
} from "../controllers/reservationController.js";
import { asyncWrapper } from "../middleware/wrapper.js";

const router = express.Router();

router.post("/", asyncWrapper(addReservation));
router.post("/extend", asyncWrapper(extendReservation));
router.get("/getcurrent", asyncWrapper(getCurrentReservation));

export default router;
