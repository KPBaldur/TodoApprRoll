import express from "express";
import { getUserHistory } from "../controllers/historyController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getUserHistory);

export default router;