"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const tokenRoutes_1 = __importDefault(require("./routes/tokenRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const alarmRoutes_1 = __importDefault(require("./routes/alarmRoutes"));
const historyRoutes_1 = __importDefault(require("./routes/historyRoutes"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
process.on("uncaughtException", err => {
    console.error("🔥 Excepción no controlada:", err);
});
process.on("unhandledRejection", err => {
    console.error("🔥 Promesa no controlada:", err);
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/token", tokenRoutes_1.default);
app.use("/api/tasks", taskRoutes_1.default);
app.use("/api/alarms", alarmRoutes_1.default);
app.use("/api/history", historyRoutes_1.default);
app.use("/api/media", mediaRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Todo App Roll v3.0 backend online." });
});
app.get("/api/test.db", async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ message: "Conexion a Neon exitosa", count: users.length });
    }
    catch (error) {
        console.error("Error de conexion:", error);
        res.status(500).json({ error: "Error conectando a la base de datos" });
    }
});
console.log("✅ Archivo .env cargado correctamente");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "OK (oculto por seguridad)" : "❌ No cargado");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
