import { useEffect } from "react";

export default function useAlarmEvents(onAlarm: (payload: any) => void) {
  useEffect(() => {
    const backend = import.meta.env.VITE_BACKEND_URL;

    if (!backend) {
      console.error("❌ No VITE_BACKEND_URL configurado");
      return;
    }

    console.log("🔌 Conectando SSE a:", `${backend}/api/alarms/events`);

    const es = new EventSource(`${backend}/api/alarms/events`);

    es.onopen = () => {
      console.log("🟢 SSE conectado");
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Evento SSE recibido:", data);
        onAlarm(data);
      } catch (e) {
        console.error("❌ Error parseando SSE:", e);
      }
    };

    es.onerror = (err) => {
      console.error("❌ SSE error:", err);
    };

    return () => {
      es.close();
      console.log("🔌 SSE desconectado");
    };
  }, [onAlarm]);
}
