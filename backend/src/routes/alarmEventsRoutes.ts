import express from "express";
import eventBus from "../services/eventBus";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Flujo SSE para escuchar alarmas
router.get("/events", authenticateToken, (req, res) => {
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
