import { get, post, put, del, patch } from './api'
export type Alarm = {
  id: string;
  name: string;
  time?: string; // opcional
  enabled: boolean;
  mediaId?: string;
  imageId?: string;
  intervalMinutes?: number;
  nextTrigger?: number;
  mediaUrl?: string;
  audioInstance?: HTMLAudioElement;
  snoozedUntil?: string | null; // nuevo campo opcional
};

const BASE = '/api/alarms';

export async function listAlarms(): Promise<Alarm[]> {
  const json = await get<{ success: boolean; data: { alarms: Alarm[] } }>(`${BASE}`)
  if (!json.success) throw new Error('Error al listar alarmas');
  return json.data.alarms as Alarm[];
}

export async function createAlarm(payload: Omit<Alarm, 'id'>): Promise<Alarm> {
  const json = await post<{ success: boolean; data: { alarm: Alarm } }>(`${BASE}`, payload)
  if (!json.success) throw new Error('Error al crear alarma');
  return json.data.alarm as Alarm;
}

export async function updateAlarm(id: string, partial: Partial<Omit<Alarm, 'id'>>): Promise<Alarm> {
  const json = await put<{ success: boolean; data: { alarm: Alarm } }>(`${BASE}/${id}`, partial)
  if (!json.success) throw new Error('Error al actualizar alarma');
  return json.data.alarm as Alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const json = await del<{ success: boolean }>(`${BASE}/${id}`)
  if (!json.success) throw new Error('Error al eliminar alarma');
}

// Nuevo: actualizar snooze (persistencia en backend)
export async function updateSnooze(id: string, snoozedUntil: string): Promise<Alarm> {
  const json = await patch<{ success: boolean; data: { alarm: Alarm } }>(`${BASE}/${id}/snooze`, { snoozedUntil })
  if (!json.success) throw new Error('Error al actualizar snooze');
  return json.data.alarm as Alarm;
}
