import { useEffect, useRef } from "react";

export default function useAlarmEvents(onAlarm: (payload: any) => void) {
  const onAlarmRef = useRef(onAlarm);

  // mantener ref actualizada sin reiniciar SSE
  useEffect(() => {
    onAlarmRef.current = onAlarm;
  }, [onAlarm]);

  useEffect(() => {
    const tokenRaw = localStorage.getItem("accessToken");
    if (!tokenRaw) return;

    const token = tokenRaw.startsWith("Bearer ")
      ? tokenRaw.slice(7)
      : tokenRaw;

    const url = `https://todoapprroll.onrender.com/api/alarms/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onAlarmRef.current(data);
      } catch (err) {
        console.error("Error SSE:", err);
      }
    };

    es.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => es.close();
  }, []);
}
