import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotnev from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import tokenRoutes from "./routes/token.routes";

dotnev.config();
const app = express();
const prisma = new PrismaClient();
console.log("✅ Archivo .env cargado correctamente");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "OK (oculto por seguridad)" : "❌ No cargado");


app.use(helmet());
app.use(cors({ origin: "*"}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/token", tokenRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Todo App Roll v3.0 backend online."});
});

app.get("/api/test.db", async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ message: "Conexion a Neon exitosa", count: users.length});
    } catch (error) {
        console.error("Error de conexion:", error);
        res.status(500).json({ error: "Error conectando a la base de datos"});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));