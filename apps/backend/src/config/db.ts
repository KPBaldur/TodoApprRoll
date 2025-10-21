import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

// Singleton PrismaClient
let prisma: PrismaClient | null = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
    logger.info("PrismaClient initialized");
  }
  return prisma;
}