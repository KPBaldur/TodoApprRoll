import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    linkAlarmToTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
} from "../controllers/taskController";

const router = express.Router();

// Proteccion con middleware de autenticacion
router.use(authenticateToken);

// Crud de tareas
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/link-alarm", linkAlarmToTask);

// Crud de subtareas
router.post("/:id/subtasks", addSubtask);
router.put("/:id/subtasks/:subtaskId", toggleSubtask);
router.delete("/:id/subtasks/:subtaskId", deleteSubtask);

export default router;
