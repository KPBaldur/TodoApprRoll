import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
} from "../controllers/taskController";

const router = express.Router();

// Proteccion con middleware de autenticacion
router.use(authenticateToken);

// Crud de tareas
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
