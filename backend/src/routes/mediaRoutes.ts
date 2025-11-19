import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/authMiddleware";
import { getMedia, uploadMedia, deleteMedia } from "../controllers/mediaController";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticateToken);

router.get("/", getMedia);
router.post("/", upload.single("file"), uploadMedia);
router.delete("/:id", deleteMedia);

export default router;
