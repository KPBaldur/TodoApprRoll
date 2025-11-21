import express from "express";
import eventBus from "../services/eventBus";
import jwt from "jsonwebtoken";

const router = express.Router();

// SSE para alarmas
router.get("/events", (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    return res.status(401).end("No token provided");
  }

  let userId: string;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    userId = decoded.id; // 🔥 EXTRAER SIN USAR req.userId
  } catch {
    return res.status(401).end("Invalid token");
  }

  // Headers SSE correctos
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  console.log("👂 Nuevo listener SSE para user:", userId);

  // Listener REAL
  const listener = (data: any) => {
    if (data.userId === userId) {
      console.log("➡️ Enviando SSE al usuario:", userId);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  eventBus.on("alarmTriggered", listener);

  req.on("close", () => {
    console.log("❌ Cliente SSE desconectado:", userId);
    eventBus.removeListener("alarmTriggered", listener);
  });
});

export default router;
