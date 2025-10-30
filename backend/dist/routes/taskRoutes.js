"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const taskController_1 = require("../controllers/taskController");
const router = express_1.default.Router();
// Proteccion con middleware de autenticacion
router.use(authMiddleware_1.authenticateToken);
// Crud de tareas
router.get("/", taskController_1.getTasks);
router.post("/", taskController_1.createTask);
router.put("/:id", taskController_1.updateTask);
router.delete("/:id", taskController_1.deleteTask);
exports.default = router;
