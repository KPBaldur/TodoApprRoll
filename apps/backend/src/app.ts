import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";
import { auth } from "./middleware/auth";
import { tasksRouter } from "./routes/tasks";
import { authRouter } from "./routes/auth";
import { mediaRouter } from "./routes/media";
import { alarmsRouter } from "./routes/alarms";
import { historyRouter } from "./routes/history";

dotenv.config();

function buildCorsOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return undefined; // permite cualquier origen en dev si no se especifica
  const list = raw.split(",").map(s => s.trim()).filter(Boolean);
  return function (origin: any, callback: any) {
    if (!origin || list.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: Origin no permitido"));
  };
}

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: buildCorsOrigins(), credentials: true }));
app.use(express.json({ limit: "2mb" }));

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, version: "3.0.0" });
});

// Auth placeholder para asignar userId
app.use(auth);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/media", mediaRouter);
app.use("/api/alarms", alarmsRouter);
app.use("/api/history", historyRouter);

// Error handler
app.use(errorHandler);