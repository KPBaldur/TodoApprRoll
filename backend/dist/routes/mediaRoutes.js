"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const mediaController_1 = require("../controllers/mediaController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get("/", mediaController_1.getMedia);
router.post("/", mediaController_1.uploadMedia);
router.delete("/:id", mediaController_1.deleteMedia);
exports.default = router;
