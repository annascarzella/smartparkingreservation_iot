import express from "express";
import {addReservation, extendReservation } from "../controllers/reservationController.js";
import { asyncWrapper } from "../utils/wrapper.js";

const router = express.Router();

router.post("/", asyncWrapper(addReservation));
router.post("/extend", asyncWrapper(extendReservation));

export default router;
