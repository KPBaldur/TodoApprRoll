"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const ACCESS_TOKEN_EXPIRES = (process.env.ACCESS_TOKEN_EXPIRES || "30m");
const REFRESH_TOKEN_EXPIRES = (process.env.REFRESH_TOKEN_EXPIRES || "2d");
// Generar Access Token
const generateAccessToken = (userId) => {
    const payload = { userId, type: "access" };
    const options = { expiresIn: ACCESS_TOKEN_EXPIRES };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.generateAccessToken = generateAccessToken;
// Generar Refresh Token
const generateRefreshToken = (userId) => {
    const payload = { userId, type: "refresh" };
    const options = { expiresIn: REFRESH_TOKEN_EXPIRES };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.generateRefreshToken = generateRefreshToken;
// Verificar token (para middleware)
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
