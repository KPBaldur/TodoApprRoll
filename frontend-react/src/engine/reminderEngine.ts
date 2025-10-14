import type { Reminder } from '../shared/reminderTypes';

export function computeNextAt(r: Reminder, now: number): number | undefined {
  if (!r.enabled) return;
  if (r._snoozeUntil && now < r._snoozeUntil) return r._snoozeUntil;

  const rep = r.repeat;
  if (rep.kind === 'interval') {
    const anchor = r._anchor ?? now;
    const period = rep.minutes * 60_000;
    const elapsed = Math.max(0, now - anchor);
    const remaining = period - (elapsed % period);
    return now + remaining;
  }
  if (rep.kind === 'daily') {
    const t = new Date();
    t.setHours(rep.hour, rep.minute, 0, 0);
    if (t.getTime() <= now) t.setDate(t.getDate() + 1);
    return t.getTime();
  }
  if (rep.kind === 'once') {
    const at = new Date(rep.isoAt).getTime();
    return at > now ? at : undefined;
  }
}

export function shouldRing(r: Reminder, now: number): boolean {
  if (!r.enabled || r._state === 'RINGING') return false;
  const nextAt = r._nextAt ?? computeNextAt(r, now);
  // tolerancia 1s para ticks
  return nextAt !== undefined && nextAt - now <= 1000;
}

export function formatRemaining(nextAt?: number, now?: number): string {
  if (!nextAt || !now) return '—';
  const ms = Math.max(0, nextAt - now);
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}