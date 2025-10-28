import prisma from "../services/prismaService";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token";

export const createSession = async (userId: string) => {
    const refreshToken = generateRefreshToken(userId);
    const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 dias
    await prisma.refreshToken.create({
        data: { userId, token: refreshToken, expiresAt: expires },
    });

    const accessToken = generateAccessToken(userId);
    return { accessToken, refreshToken };
};

export const refreshSession = async (token: string) => {
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== "refresh") return null;

    const dbToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!dbToken || dbToken.expiresAt < new Date()) return null;

    const newAccess = generateAccessToken(decoded.userId);
    return { accessToken: newAccess };
};

export const revokeSession = async (token: string) => {
    await prisma.refreshToken.deleteMany({ where: { token } });
}