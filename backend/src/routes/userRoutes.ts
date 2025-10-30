import express from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getProfile, updateProfile } from "../controllers/userController";

const router = express.Router();

router.use(authenticateToken);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;