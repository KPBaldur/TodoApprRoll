import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from "../controllers/userController";

const router = express.Router();
router.use(authenticateToken);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.delete("/profile", deleteAccount);

export default router;
