import { describe, it, expect } from 'vitest';
import { nextTriggerMsPure } from './alarmMath';
import type { Alarm } from '../services/alarmService';

const base: Alarm = {
  id: 'a1',
  name: 'Demo',
  enabled: true,
  intervalMinutes: 1,
  mediaId: undefined,
  imageId: undefined,
  snoozedUntil: null,
};

describe('nextTriggerMsPure', () => {
  it('undefined si está deshabilitada', () => {
    expect(nextTriggerMsPure({ ...base, enabled: false }, Date.now(), Date.now())).toBeUndefined();
  });

  it('0 si está activa', () => {
    expect(nextTriggerMsPure(base, Date.now(), Date.now(), 'a1')).toBe(0);
  });

  it('respeta snoozedUntil futuro (~5m)', () => {
    const now = Date.now();
    const a = { ...base, snoozedUntil: new Date(now + 5 * 60_000).toISOString() };
    const r = nextTriggerMsPure(a, now, now);
    expect(r!).toBeGreaterThan(4 * 60_000);
    expect(r!).toBeLessThanOrEqual(5 * 60_000 + 1000);
  });

  it('con 1 min y ancla en now, ~60s', () => {
    const now = Date.now();
    const r = nextTriggerMsPure(base, now, now)!;
    expect(r).toBeGreaterThan(59_000);
    expect(r).toBeLessThanOrEqual(60_000);
  });
});