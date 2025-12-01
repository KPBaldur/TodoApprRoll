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
    reorderTasks,
    reorderSubtasks,
    archiveCompletedTasks,
} from "../controllers/taskController";

const router = express.Router();

// Proteccion con middleware de autenticacion
router.use(authenticateToken);

// Reordenar (antes de /:id para evitar conflictos)
router.post("/reorder", reorderTasks);

// Archivar completadas (antes de /:id)
router.post("/archive-completed", archiveCompletedTasks);

// Crud de tareas
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/link-alarm", linkAlarmToTask);

// Crud de subtareas
router.post("/:id/subtasks", addSubtask);
router.post("/:id/subtasks/reorder", reorderSubtasks);
router.put("/:id/subtasks/:subtaskId", toggleSubtask);
router.delete("/:id/subtasks/:subtaskId", deleteSubtask);

export default router;
