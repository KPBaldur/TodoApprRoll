import { useEffect } from "react";

export default function useAlarmEvents(onAlarm: (payload: any) => void) {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let es: EventSource | null = null;

    const connect = () => {
      const url = `https://todoapprroll.onrender.com/api/alarms/events?token=${encodeURIComponent(token)}`;
      es = new EventSource(url);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onAlarm(data);
        } catch (err) {
          console.error("❌ Error SSE:", err);
        }
      };

      es.onerror = () => {
        console.warn("⚠️ SSE desconectado, reintentando en 3s…");
        es?.close();
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => es?.close();
  }, [onAlarm]);
}
