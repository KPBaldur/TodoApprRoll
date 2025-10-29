import prisma from "../services/prismaService";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token";

export const createSession = async (userId: string) => {
    const refreshToken = generateRefreshToken(userId);
    const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 dias
    
    const newToken = await prisma.refreshToken.create({
        data: { userId, token: refreshToken, expiresAt: expires },
    });

    const accessToken = generateAccessToken(userId);

    return { 
        id: newToken.id,
        accessToken, 
        refreshToken,
        createdAt: newToken.createdAt,
        expiresAt: expires,
 };
};

export const refreshSession = async (token: string) => {
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== "refresh") return null;

    const dbToken = await prisma.refreshToken.findUnique({ where: { token } });

    if (!dbToken || dbToken.expiresAt < new Date()) return null;

    const newAccess = generateAccessToken(decoded.userId);

    return { 
        id: dbToken.id,
        userId: decoded.userId,
        accessToken: newAccess,
        createdAt: dbToken.createdAt,
        expiresAt: dbToken.expiresAt };
};

export const revokeSession = async (token: string) => {
    const dbToken = await prisma.refreshToken.findUnique({
        where: { token },
    });

    if (!dbToken) return null;

    await prisma.refreshToken.delete({
        where: { token },
    });

    return {
        id: dbToken.id,
        userId: dbToken.userId,
        revokedAt: new Date(),
    };
};
