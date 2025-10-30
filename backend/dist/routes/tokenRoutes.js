"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tokenController_1 = require("../controllers/tokenController");
const router = express_1.default.Router();
router.post("/refresh", tokenController_1.refreshAccessToken);
router.post("/logout", tokenController_1.logout);
exports.default = router;
