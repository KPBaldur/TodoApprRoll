import { useEffect } from "react";

export default function useAlarmEvents(onAlarm: (payload: any) => void) {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const url = "https://todoapprroll.onrender.com/api/alarms/events";
    const es = new EventSource(url, {
      withCredentials: true
    });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onAlarm(data);
      } catch (err) {
        console.error("Error SSE:", err);
      }
    };

    es.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => {
      es.close();
    };
  }, [onAlarm]);
}
