import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/authRoutes";
import tokenRoutes from "./routes/tokenRoutes";
import taskRoutes from "./routes/taskRoutes";
import alarmRoutes from "./routes/alarmRoutes";
import historyRoutes from "./routes/historyRoutes";
import mediaRoutes from "./routes/mediaRoutes";
import userRoutes from "./routes/userRoutes";

import { initializeAlarms } from "./services/schedulerService";
import alarmEventsRoutes from "./routes/alarmEventsRoutes";

/* import prisma from "./services/prismaService";*/

dotenv.config();
const prisma = new PrismaClient();
const app = express();

// ✅ Lista blanca simple
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://todoapproll-frontend.vercel.app",
];

// ✅ Middleware CORS limpio y sin duplicaciones
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Seguridad
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use("/api/alarms", alarmEventsRoutes);

app.use(express.json());

process.on("uncaughtException", (err) => {
  console.error("🔥 Excepción no controlada:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("🔥 Promesa no controlada:", err);
});

// ✅ Rutas
app.use("/api/auth", authRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/alarms", alarmRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);

// ✅ Rutas de test
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Todo App Roll v3.0 backend online." });
});

app.get("/api/test.db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ message: "Conexion a Neon exitosa", count: users.length });
  } catch (error) {
    console.error("Error de conexion:", error);
    res.status(500).json({ error: "Error conectando a la base de datos" });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h2>🚀 TodoAppRoll Backend</h2>
    <p>Servidor activo y corriendo correctamente.</p>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
      <li><a href="/api/auth/login">/api/auth/login</a></li>
      <li><a href="/api/tasks">/api/tasks</a></li>
    </ul>
  `);
});

console.log("✅ Archivo .env cargado correctamente");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "OK (oculto por seguridad)" : "❌ No cargado");

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
initializeAlarms();