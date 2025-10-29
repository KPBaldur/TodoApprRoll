import express from "express";
import { getUserHistory } from "@controllers/historyController";
import { authenticateToken } from "@middleware/auth.middleware";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getUserHistory);

export default router;