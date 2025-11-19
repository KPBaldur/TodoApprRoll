import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Alarm,
  AlarmCreatePayload,
  AlarmUpdatePayload,
  Media,
} from "../services/alarmService";
import {
  getAlarms,
  createAlarm,
  updateAlarm,
  toggleAlarm,
  deleteAlarm,
  listMedia,
} from "../services/alarmService";

type UseAlarmsResult = {
  alarms: Alarm[];
  media: Media[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  create: (payload: AlarmCreatePayload) => Promise<void>;
  update: (id: string, payload: AlarmUpdatePayload) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useAlarms(): UseAlarmsResult {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, m] = await Promise.all([getAlarms(), listMedia()]);
      setAlarms(list);
      setMedia(m);
    } catch (e: any) {
      setError(e.message || "Error al cargar alarmas");
      setAlarms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFn = useCallback(async (payload: AlarmCreatePayload) => {
    // Validaciones
    if (!payload.name?.trim()) throw new Error("El nombre es obligatorio");
    if (payload.scheduleAt && payload.cronExpr)
      throw new Error("Si se define fecha, cronExpr debe ser null");
    if (!payload.scheduleAt && !payload.cronExpr)
      throw new Error("Debe elegir fecha específica o cron");
    if ((payload.snoozeMins ?? 0) < 1) throw new Error("Snooze mínimo 1 minuto");

    // Optimista
    const temp: Alarm = {
      id: `temp-${Date.now()}`,
      name: payload.name.trim(),
      enabled: payload.enabled ?? true,
      scheduleAt: payload.scheduleAt,
      cronExpr: payload.cronExpr,
      snoozeMins: payload.snoozeMins ?? 5,
      audioId: payload.audioId ?? null,
      imageId: payload.imageId ?? null,
      audio: null,
      image: null,
    };
    setAlarms((prev) => [temp, ...prev]);

    try {
      const created = await createAlarm(payload);
      setAlarms((prev) =>
        prev.map((a) => (a.id === temp.id ? created : a))
      );
    } catch (e: any) {
      setAlarms((prev) => prev.filter((a) => a.id !== temp.id));
      throw e;
    }
  }, []);

  const updateFn = useCallback(async (id: string, payload: AlarmUpdatePayload) => {
    // Validaciones clave
    if (typeof payload.name !== "undefined" && !String(payload.name).trim()) {
      throw new Error("El nombre es obligatorio");
    }
    if (payload.scheduleAt && payload.cronExpr) {
      throw new Error("Si se define fecha, cronExpr debe ser null");
    }
    if ((payload.snoozeMins ?? 1) < 1) {
      throw new Error("Snooze mínimo 1 minuto");
    }

    const prev = alarms;
    setAlarms((list) =>
      list.map((a) => (a.id === id ? { ...a, ...payload } as Alarm : a))
    );

    try {
      const updated = await updateAlarm(id, payload);
      setAlarms((list) => list.map((a) => (a.id === id ? updated : a)));
    } catch (e: any) {
      setAlarms(prev);
      throw e;
    }
  }, [alarms]);

  const toggleFn = useCallback(async (id: string) => {
    const prev = alarms;
    setAlarms((list) =>
      list.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
    try {
      const updated = await toggleAlarm(id);
      setAlarms((list) => list.map((a) => (a.id === id ? updated : a)));
    } catch (e: any) {
      setAlarms(prev);
      throw e;
    }
  }, [alarms]);

  const removeFn = useCallback(async (id: string) => {
    const prev = alarms;
    setAlarms((list) => list.filter((a) => a.id !== id));
    try {
      await deleteAlarm(id);
    } catch (e: any) {
      setAlarms(prev);
      throw e;
    }
  }, [alarms]);

  return {
    alarms,
    media,
    loading,
    error,
    refresh,
    create: createFn,
    update: updateFn,
    toggle: toggleFn,
    remove: removeFn,
  };
}