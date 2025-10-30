"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const alarmController_1 = require("../controllers/alarmController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get("/", alarmController_1.getAlarms);
router.post("/", alarmController_1.createAlarm);
router.put("/:id", alarmController_1.updateAlarm);
router.delete("/:id", alarmController_1.deleteAlarm);
exports.default = router;
