import express from "express";
import fetchController from "../controllers/fetchController.js";

const router = express.Router();

router.get("/all", fetchController.fetchAll);
router.get("/gateway/:id", fetchController.fetchByIdGateway);
router.get("/lock/:id", fetchController.fetchByIdLock);

export default router;
