import { Router } from "express";
import * as alarmsController from "../controllers/alarmsController";

export const alarmsRouter = Router();

alarmsRouter.get("/", alarmsController.notImplemented);