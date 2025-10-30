import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
    getAlarms,
    createAlarm,
    updateAlarm,
    deleteAlarm,
} from "../controllers/alarmController";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getAlarms);
router.post("/", createAlarm);
router.put("/:id", updateAlarm);
router.delete("/:id", deleteAlarm);

export default router;
