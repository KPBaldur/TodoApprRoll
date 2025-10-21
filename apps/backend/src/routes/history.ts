import { Router } from "express";
import * as historyController from "../controllers/historyController";

export const historyRouter = Router();

historyRouter.get("/", historyController.notImplemented);