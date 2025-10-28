import express from "express";
import { register, login } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import prisma from "../services/prismaService";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticateToken, async (req, res) => {
    const userId = (req as any).userID;
    const user = await prisma.user.findUnique({
        where: { id: userId},
        select: { id: true, username: true, createdAt: true},
    });
    res.json({ user});
});

export default router;
