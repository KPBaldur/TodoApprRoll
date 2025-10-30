import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { getMedia, uploadMedia, deleteMedia } from "../controllers/mediaController";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getMedia);
router.post("/", uploadMedia);
router.delete("/:id", deleteMedia);

export default router;
