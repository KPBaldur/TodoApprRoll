import jwt, { SignOptions, Secret } from "jsonwebtoken";
import ms from "ms";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "super-secret-key";
const ACCESS_TOKEN_EXPIRES = (process.env.ACCESS_TOKEN_EXPIRES || "30m") as ms.StringValue;
const REFRESH_TOKEN_EXPIRES = (process.env.REFRESH_TOKEN_EXPIRES || "2d") as ms.StringValue;

// Generar Access Token
export const generateAccessToken = (userId: string): string => {
  const payload = { userId, type: "access" };
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Generar Refresh Token
export const generateRefreshToken = (userId: string): string => {
  const payload = { userId, type: "refresh" };
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verificar token (para middleware)
export const verifyToken = (token: string): { userId: string; type: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
  } catch {
    return null;
  }
};
