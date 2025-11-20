import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarm
} from "../controllers/alarmController";


const router = express.Router();

router.use(authenticateToken);

// CRUD
router.get("/", getAlarms);
router.post("/", createAlarm);
router.put("/:id", updateAlarm);
router.delete("/:id", deleteAlarm);
router.patch("/:id/toggle", toggleAlarm);

export default router;