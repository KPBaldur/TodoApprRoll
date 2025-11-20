import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarm,
  snoozeAlarm,      // <<< NUEVO
} from "../controllers/alarmController";

const router = express.Router();

router.use(authenticateToken);

// CRUD
router.get("/", getAlarms);
router.post("/", createAlarm);
router.put("/:id", updateAlarm);
router.delete("/:id", deleteAlarm);

// Activar / desactivar
router.patch("/:id/toggle", toggleAlarm);

router.patch("/:id/snooze", snoozeAlarm);   // <<< NUEVO ENDPOINT

export default router;