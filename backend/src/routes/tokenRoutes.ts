import express from "express";
import { refreshAccessToken, logout } from "../controllers/tokenController";

const router = express.Router();

router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;