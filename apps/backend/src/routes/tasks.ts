import { Router } from "express";
import * as tasksController from "../controllers/tasksController";

export const tasksRouter = Router();

tasksRouter.get("/", tasksController.list);
tasksRouter.post("/", tasksController.create);
tasksRouter.delete("/:id", tasksController.remove);