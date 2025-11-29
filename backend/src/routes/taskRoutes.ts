import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    permanentDeleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    reorderTasks,
    reorderSubtasks,
} from "../controllers/taskController";

const router = express.Router();

router.use(authenticateToken);

// Reorder
router.post("/reorder", reorderTasks);

// Tasks
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask); // Soft delete
router.post("/:id/restore", restoreTask); // Restore from trash
router.delete("/:id/permanent", permanentDeleteTask); // Hard delete

// Subtasks
router.post("/:id/subtasks", addSubtask);
router.post("/:id/subtasks/reorder", reorderSubtasks);
router.put("/:id/subtasks/:subtaskId", updateSubtask);
router.delete("/:id/subtasks/:subtaskId", deleteSubtask);

export default router;
