import express from "express";
import loginUser from "../controllers/loginController.js";
import { asyncWrapper } from "../middleware/wrapper.js";

const router = express.Router();

router.post("/", asyncWrapper(loginUser));

export default router;
