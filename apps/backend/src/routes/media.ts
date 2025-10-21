import { Router } from "express";
import * as mediaController from "../controllers/mediaController";

export const mediaRouter = Router();

mediaRouter.get("/", mediaController.notImplemented);