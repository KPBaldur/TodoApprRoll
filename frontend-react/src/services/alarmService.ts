export type Alarm = {
  id: string;
  name: string;
  time?: string; // opcional
  enabled: boolean;
  mediaId?: string;
  intervalMinutes?: number;
  nextTrigger?: number;
  mediaUrl?: string;
  audioInstance?: HTMLAudioElement;
};

const BASE = '/api/alarms';

export async function listAlarms(): Promise<Alarm[]> {
  const res = await fetch(`${BASE}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al listar alarmas');
  return json.data.alarms as Alarm[];
}

export async function createAlarm(payload: Omit<Alarm, 'id'>): Promise<Alarm> {
  const res = await fetch(`${BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al crear alarma');
  return json.data.alarm as Alarm;
}

export async function updateAlarm(id: string, partial: Partial<Omit<Alarm, 'id'>>): Promise<Alarm> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al actualizar alarma');
  return json.data.alarm as Alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al eliminar alarma');
}