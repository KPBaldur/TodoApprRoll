import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Reminder } from '../shared/reminderTypes';
import { computeNextAt, shouldRing } from '../engine/reminderEngine';

type Ctx = {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  active?: Reminder;
  snooze: (mins: number) => void;
  stop: () => void;
};

const ReminderContext = createContext<Ctx>(null as any);
export const useReminders = () => useContext(ReminderContext);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [active, setActive] = useState<Reminder>();
  const activeRef = useRef<Reminder | undefined>(undefined);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistencia MVP: localStorage (luego cambiamos a backend JSON)
  useEffect(() => {
    const s = localStorage.getItem('reminders');
    if (s) {
      try { setReminders(JSON.parse(s)); } catch {}
    }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('reminders', JSON.stringify(reminders)); } catch {}
  }, [reminders]);

  // Scheduler resiliente: no dependas de reminders/active para no reiniciar el timer
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let ringCandidate: Reminder | undefined;

      setReminders(prev => prev.map(r => {
        // Si está sonando, no recalculamos (congelado)
        if (r._state === 'RINGING') {
          console.log('[TICK]', now, r.title, r._nextAt, r._state);
          return r;
        }

        const nextAt = computeNextAt(r, now);
        const scheduled: Reminder = {
          ...r,
          _nextAt: nextAt,
          _state: r.enabled ? 'SCHEDULED' : 'DISABLED'
        };

        // logs de depuración
        console.log('[TICK]', now, scheduled.title, scheduled._nextAt, scheduled._state);

        // Si no hay activo, evaluar disparo con tolerancia
        if (!activeRef.current && shouldRing(scheduled, now)) {
          ringCandidate = scheduled;
        }
        return scheduled;
      }));

      // Disparo fuera del setState para evitar anidar actualizaciones
      if (ringCandidate) {
        startRinging(ringCandidate);
      }
    };

    // Monta un único interval
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    intervalIdRef.current = setInterval(tick, 1000);

    // Limpieza
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    };
  }, []); // sin dependencias

  function startRinging(r: Reminder) {
    // Congelar contador: marcamos RINGING y guardamos en ref
    activeRef.current = r;
    setActive(r);
    setReminders(prev => prev.map(x => x.id === r.id ? { ...x, _state: 'RINGING' } : x));
  }

  function snooze(mins: number) {
    const current = activeRef.current;
    if (!current) return;
    const until = Date.now() + mins * 60_000;

    setReminders(prev => prev.map(r => r.id === current.id
      ? { ...r, _state: 'SNOOZED', _snoozeUntil: until, _nextAt: until }
      : r
    ));
    activeRef.current = undefined;
    setActive(undefined);
  }

  function stop() {
    const current = activeRef.current;
    if (!current) return;

    const now = Date.now();
    setReminders(prev => prev.map(r => {
      if (r.id !== current.id) return r;

      if (r.repeat.kind === 'interval') {
        // Reinicia ciclo desde ahora y recalcula nextAt inmediatamente
        const reset: Reminder = { ...r, _state: 'SCHEDULED', _snoozeUntil: undefined, _anchor: now };
        const nextAt = computeNextAt(reset, now);
        return { ...reset, _nextAt: nextAt };
      }

      // daily/once: limpiar snooze y recalcular nextAt ahora
      const reset: Reminder = { ...r, _state: 'SCHEDULED', _snoozeUntil: undefined };
      const nextAt = computeNextAt(reset, now);
      return { ...reset, _nextAt: nextAt };
    }));

    activeRef.current = undefined;
    setActive(undefined);
  }

  return (
    <ReminderContext.Provider value={{ reminders, setReminders, active, snooze, stop }}>
      {children}
    </ReminderContext.Provider>
  );
}