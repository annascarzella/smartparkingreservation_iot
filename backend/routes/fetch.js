import express from "express";
import fetchController from "../controllers/fetchController.js";

const router = express.Router();

router.get("/all", fetchController.fetchAll);
router.get("/:id", fetchController.fetchById);

export default router;
