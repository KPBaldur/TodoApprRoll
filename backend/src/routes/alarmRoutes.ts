import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
    getAlarms,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
} from "../controllers/alarmController";

const router = express.Router();

router.use(authenticateToken);

// Crud de alarmas
router.get("/", getAlarms);
router.post("/", createAlarm);
router.put("/:id", updateAlarm);
router.patch("/:id/toggle", toggleAlarm);
router.delete("/:id", deleteAlarm);

export default router;
