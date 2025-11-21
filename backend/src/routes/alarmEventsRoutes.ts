import express from "express";
import eventBus from "../services/eventBus";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/events", (req, res) => {
  let token = req.query.token as string;

  if (!token) return res.status(401).end("No token provided");

  // ✅ Por si el token viene como "Bearer xxxx"
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  let userId: string | undefined;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // ✅ Soporte para varios formatos de JWT:
    userId =
      decoded.id ||
      decoded.userId ||
      decoded.sub ||
      decoded.user?.id;

    console.log("🧾 JWT decoded:", decoded);
  } catch (e) {
    console.error("❌ JWT verify error:", e);
    return res.status(401).end("Invalid token");
  }

  if (!userId) {
    console.error("❌ Token válido pero sin userId usable");
    return res.status(401).end("Token without userId");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  console.log("👂 Nuevo listener SSE para user:", userId);

  const listener = (data: any) => {
    if (data.userId === userId) {
      console.log("➡️ Enviando SSE a:", userId);
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
