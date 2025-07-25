import express from "express";
import registerUser from "../controllers/registrationController.js";
import { asyncWrapper } from "../middleware/wrapper.js";

const router = express.Router();

router.post("/", asyncWrapper(registerUser));

export default router;
