import express from "express";
import eventBus from "../services/eventBus";
import jwt from "jsonwebtoken"; // ← AGREGAR ESTA LÍNEA

const router = express.Router();

// Flujo SSE para escuchar alarmas
router.get("/events", (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.flushHeaders();

  const userId = req.userId;

  const listener = (data: any) => {
    if (data.userId === userId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  eventBus.on("alarmTriggered", listener);

  req.on("close", () => {
    eventBus.removeListener("alarmTriggered", listener);
  });
});

export default router;
