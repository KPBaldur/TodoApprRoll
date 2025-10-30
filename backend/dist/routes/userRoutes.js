"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get("/profile", userController_1.getProfile);
router.put("/profile", userController_1.updateProfile);
router.delete("/profile", userController_1.deleteAccount);
exports.default = router;
