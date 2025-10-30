"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeSession = exports.refreshSession = exports.createSession = void 0;
const prismaService_1 = __importDefault(require("../services/prismaService"));
const token_1 = require("../utils/token");
const createSession = async (userId) => {
    const refreshToken = (0, token_1.generateRefreshToken)(userId);
    const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 dias
    const newToken = await prismaService_1.default.refreshToken.create({
        data: { userId, token: refreshToken, expiresAt: expires },
    });
    const accessToken = (0, token_1.generateAccessToken)(userId);
    return {
        id: newToken.id,
        accessToken,
        refreshToken,
        createdAt: newToken.createdAt,
        expiresAt: expires,
    };
};
exports.createSession = createSession;
const refreshSession = async (token) => {
    const decoded = (0, token_1.verifyToken)(token);
    if (!decoded || decoded.type !== "refresh")
        return null;
    const dbToken = await prismaService_1.default.refreshToken.findUnique({ where: { token } });
    if (!dbToken || dbToken.expiresAt < new Date())
        return null;
    const newAccess = (0, token_1.generateAccessToken)(decoded.userId);
    return {
        id: dbToken.id,
        userId: decoded.userId,
        accessToken: newAccess,
        createdAt: dbToken.createdAt,
        expiresAt: dbToken.expiresAt
    };
};
exports.refreshSession = refreshSession;
const revokeSession = async (token) => {
    const dbToken = await prismaService_1.default.refreshToken.findUnique({
        where: { token },
    });
    if (!dbToken)
        return null;
    await prismaService_1.default.refreshToken.delete({
        where: { token },
    });
    return {
        id: dbToken.id,
        userId: dbToken.userId,
        revokedAt: new Date(),
    };
};
exports.revokeSession = revokeSession;
