import { Router } from "express";
import * as authController from "../controllers/authController";

export const authRouter = Router();

authRouter.get("/whoami", authController.whoami);