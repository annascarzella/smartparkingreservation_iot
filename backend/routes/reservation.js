import express from "express";
import reservationController from "../controllers/reservationController.js";

const router = express.Router();

router.post("/", reservationController.addReservation);
router.post("/extend", reservationController.extendReservation);

export default router;
