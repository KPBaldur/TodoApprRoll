// src/services/alarms.ts
import { API_URL, fetchWithAuth } from "./tasks";

export interface Alarm {
  id: string;
  name: string;
  scheduleAt?: string | null;
  cronExpr?: string | null;
  enabled?: boolean;
}

export async function fetchAlarms(): Promise<Alarm[]> {
  const res = await fetchWithAuth(`${API_URL}/alarms`);
  if (!res.ok) {
    throw new Error("No se pudieron obtener las alarmas");
  }
  return res.json();
}

