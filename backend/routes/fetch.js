import express from "express";
import {fetchAll, fetchByIdGateway, fetchByIdLock} from "../controllers/fetchController.js";
import { asyncWrapper } from "../middleware/wrapper.js";

const router = express.Router();

router.get("/all", asyncWrapper(fetchAll));
router.get("/gateway/:id", asyncWrapper(fetchByIdGateway));
router.get("/lock/:id", asyncWrapper(fetchByIdLock));

export default router;
