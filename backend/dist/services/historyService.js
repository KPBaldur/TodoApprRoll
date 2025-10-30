"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHistory = void 0;
const prismaService_1 = __importDefault(require("./prismaService"));
const logHistory = async (userId, entity, action, payload) => {
    try {
        await prismaService_1.default.history.create({
            data: {
                userId,
                entity,
                action,
                payloadJson: JSON.stringify(payload),
            },
        });
        console.log(`[HISTORY] ${entity} -> ${action}`);
    }
    catch (error) {
        console.error("[HISTORY] Error registrando evento:", error);
    }
};
exports.logHistory = logHistory;
