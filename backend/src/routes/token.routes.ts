import express from "express";
import { refreshAccessToken, logout } from "../controllers/token.controller";

const router = express.Router();

router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;