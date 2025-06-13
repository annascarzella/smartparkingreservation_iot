import express from "express";
import arrivalController from "../controllers/arrivalController.js";

const router = express.Router();

router.post("/", arrivalController.NotifyArrival);

export default router;
