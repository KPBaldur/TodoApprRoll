// frontend/src/services/alarmService.ts
// Servicio de alarmas SOLO Pomodoro

import { API_URL, fetchWithAuth } from "./tasks";

export type MediaType = "audio" | "image";

export interface Media {
  id: string;
  name: string;
  url: string;
  type?: MediaType;
  publicId?: string;
}

export interface Alarm {
  id: string;
  name: string;
  enabled: boolean;
  scheduleAt: string | null;
  snoozeMins: number; // siempre numérico en el front
  audioId: string | null;
  imageId: string | null;
  audio?: { id: string; name: string; url: string } | null;
  image?: { id: string; name: string; url: string } | null;
}

/**
 * Para crear Pomodoro:
 * - name (obligatorio)
 * - snoozeMins (obligatorio)
 * - audioId / imageId opcionales
 * - enabled opcional (true por defecto)
 * - scheduleAt opcional (solo para casos especiales, normalmente lo calcula el backend)
 */
export interface AlarmCreatePayload {
  name: string;
  snoozeMins: number;
  audioId: string | null;
  imageId: string | null;
  enabled?: boolean;
  scheduleAt?: string | null;
}

export type AlarmUpdatePayload = Partial<AlarmCreatePayload> & {
  enabled?: boolean;
  scheduleAt?: string | null;
};

export async function getAlarms(): Promise<Alarm[]> {
  const res = await fetchWithAuth(`${API_URL}/alarms`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "No se pudieron obtener las alarmas");
  }
  return (await res.json()) as Alarm[];
}

export async function createAlarm(payload: AlarmCreatePayload): Promise<Alarm> {
  const res = await fetchWithAuth(`${API_URL}/alarms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Error al crear alarma");
  }
  return (await res.json()) as Alarm;
}

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
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Error al actualizar alarma");
  }
  return (await res.json()) as Alarm;
}

export async function toggleAlarm(id: string): Promise<Alarm> {
  const res = await fetchWithAuth(`${API_URL}/alarms/${id}/toggle`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Error al activar/desactivar alarma");
  }
  return (await res.json()) as Alarm;
}

export async function deleteAlarm(id: string): Promise<boolean> {
  const res = await fetchWithAuth(`${API_URL}/alarms/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Error al eliminar alarma");
  }
  return true;
}

/** Listado de media para seleccionar audio e imagen */
export async function listMedia(): Promise<Media[]> {
  const res = await fetchWithAuth(`${API_URL}/media`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo cargar la multimedia");
  }
  return (await res.json()) as Media[];
}
