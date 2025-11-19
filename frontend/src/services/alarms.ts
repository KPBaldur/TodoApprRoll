// src/services/alarms.ts
import { API_URL, fetchWithAuth } from "./tasks";

export interface Alarm {
  id: string;
  name: string;
  scheduleAt?: string | null;
  cronExpr?: string | null;
  enabled?: boolean;
  // Campos adicionales opcionales para compatibilidad con el hook
  snoozeMins?: number;
  audioId?: string | null;
  imageId?: string | null;
  audio?: any | null;
  image?: any | null;
}

export interface Media {
  id: string;
  type: "AUDIO" | "IMAGE";
  name: string;
  url: string;
}

export interface AlarmCreatePayload {
  name: string;
  scheduleAt?: string | null;
  cronExpr?: string | null;
  enabled?: boolean;
  snoozeMins?: number;
  audioId?: string | null;
  imageId?: string | null;
}

export type AlarmUpdatePayload = Partial<AlarmCreatePayload>;

export async function fetchAlarms(): Promise<Alarm[]> {
  const res = await fetchWithAuth(`${API_URL}/alarms`);
  if (!res.ok) {
    throw new Error("No se pudieron obtener las alarmas");
  }
  return res.json();
}

// Alias para el hook (compatibilidad de nombres)
export const getAlarms = fetchAlarms;

// Crear alarma
export async function createAlarm(payload: AlarmCreatePayload): Promise<Alarm> {
  const res = await fetchWithAuth(`${API_URL}/alarms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await safeMessage(res, "No se pudo crear la alarma");
    throw new Error(msg);
  }
  return res.json();
}

// Actualizar alarma
export async function updateAlarm(
  id: string,
  payload: AlarmUpdatePayload
): Promise<Alarm> {
  const res = await fetchWithAuth(`${API_URL}/alarms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await safeMessage(res, "No se pudo actualizar la alarma");
    throw new Error(msg);
  }
  return res.json();
}

// Activar/Desactivar alarma
export async function toggleAlarm(id: string): Promise<Alarm> {
  const res = await fetchWithAuth(`${API_URL}/alarms/${id}/toggle`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const msg = await safeMessage(res, "No se pudo alternar la alarma");
    throw new Error(msg);
  }
  return res.json();
}

// Eliminar alarma
export async function deleteAlarm(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_URL}/alarms/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const msg = await safeMessage(res, "No se pudo eliminar la alarma");
    throw new Error(msg);
  }
}

// Listar multimedia (si el endpoint no existe, devolver lista vacía)
export async function listMedia(): Promise<Media[]> {
  const res = await fetchWithAuth(`${API_URL}/media`);
  if (!res.ok) {
    // Si el backend aún no tiene este recurso, devolvemos vacío
    return [];
  }
  return res.json();
}

// Utilidad para leer mensajes de error seguro
async function safeMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

