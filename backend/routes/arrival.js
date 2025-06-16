import express from "express";
import NotifyArrival from "../controllers/arrivalController.js";
import { asyncWrapper } from "../utils/wrapper.js";

const router = express.Router();

router.post("/", asyncWrapper(NotifyArrival));

export default router;
