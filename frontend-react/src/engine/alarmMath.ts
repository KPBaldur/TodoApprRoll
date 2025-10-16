import type { Alarm } from '../services/alarmService';

export function nextTriggerMsPure(
  alarm: Alarm,
  nowMs: number,
  anchorMs: number | undefined,
  activeAlarmId?: string | null
): number | undefined {
  if (!alarm.enabled) return undefined;
  if (activeAlarmId && activeAlarmId === alarm.id) return 0;

  if (alarm.snoozedUntil) {
    const t = Date.parse(alarm.snoozedUntil);
    if (!Number.isNaN(t)) {
      const diff = t - nowMs;
      if (diff > 0) return diff;
    }
  }

  const intervalMs = alarm.intervalMinutes ? alarm.intervalMinutes * 60_000 : undefined;
  if (!intervalMs) return undefined;

  const anchor = anchorMs ?? nowMs;
  const elapsed = nowMs - anchor;
  const mod = elapsed % intervalMs;
  const remainingExact = intervalMs - mod;
  return remainingExact < 1000 ? 0 : remainingExact;
}