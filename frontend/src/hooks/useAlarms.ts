// src/hooks/useAlarms.ts
import { useCallback, useEffect, useState } from "react";
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

  /* --------------------------------------------
     REFRESH
  -------------------------------------------- */
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

  /* --------------------------------------------
     CREATE — Pomodoro Only
  -------------------------------------------- */
  const createFn = useCallback(async (payload: AlarmCreatePayload) => {
    if (!payload.name?.trim()) {
      throw new Error("El nombre es obligatorio");
    }

    if ((payload.snoozeMins ?? 0) < 1) {
      throw new Error("Snooze mínimo 1 minuto");
    }

    // El backend generará scheduleAt automáticamente.
    const temp: Alarm = {
      id: `temp-${Date.now()}`,
      name: payload.name.trim(),
      enabled: payload.enabled ?? true,
      snoozeMins: payload.snoozeMins,
      audioId: payload.audioId ?? null,
      imageId: payload.imageId ?? null,
      scheduleAt: null,
      audio: null,
      image: null
    };

    setAlarms((prev) => [temp, ...prev]);

    try {
      const created = await createAlarm(payload);
      setAlarms((prev) => prev.map((a) => (a.id === temp.id ? created : a)));
    } catch (e: any) {
      setAlarms((prev) => prev.filter((a) => a.id !== temp.id));
      throw e;
    }
  }, []);

  /* --------------------------------------------
     UPDATE — Pomodoro Only
  -------------------------------------------- */
  const updateFn = useCallback(
    async (id: string, payload: AlarmUpdatePayload) => {
      if (payload.name !== undefined && !String(payload.name).trim()) {
        throw new Error("El nombre es obligatorio");
      }

      if (
        payload.snoozeMins !== undefined &&
        (payload.snoozeMins ?? 0) < 1
      ) {
        throw new Error("Snooze mínimo 1 minuto");
      }

      const prev = alarms;
      setAlarms((list) =>
        list.map((a) => (a.id === id ? { ...a, ...payload } : a))
      );

      try {
        const updated = await updateAlarm(id, payload);
        setAlarms((list) =>
          list.map((a) => (a.id === id ? updated : a))
        );
      } catch (e: any) {
        setAlarms(prev);
        throw e;
      }
    },
    [alarms]
  );

  /* --------------------------------------------
     TOGGLE
  -------------------------------------------- */
  const toggleFn = useCallback(
    async (id: string) => {
      const prev = alarms;

      setAlarms((list) =>
        list.map((a) =>
          a.id === id ? { ...a, enabled: !a.enabled } : a
        )
      );

      try {
        const updated = await toggleAlarm(id);
        setAlarms((list) =>
          list.map((a) => (a.id === id ? updated : a))
        );
      } catch (e: any) {
        setAlarms(prev);
        throw e;
      }
    },
    [alarms]
  );

  /* --------------------------------------------
     REMOVE
  -------------------------------------------- */
  const removeFn = useCallback(
    async (id: string) => {
      const prev = alarms;

      setAlarms((list) => list.filter((a) => a.id !== id));

      try {
        await deleteAlarm(id);
      } catch (e: any) {
        setAlarms(prev);
        throw e;
      }
    },
    [alarms]
  );

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
