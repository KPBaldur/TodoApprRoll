import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { AlarmProvider, useAlarm } from '../AlarmContext'
import type { Alarm } from '../../services/alarmService'

vi.mock('../../services/alarmService', () => ({
  listAlarms: vi.fn(),
  createAlarm: vi.fn(),
  updateAlarm: vi.fn(),
  deleteAlarm: vi.fn(),
  updateSnooze: vi.fn(),
}))
vi.mock('../../services/mediaService', () => ({
  listMedia: vi.fn(),
}))

import {
  listAlarms,
  updateAlarm as updateAlarmApi,
  updateSnooze,
} from '../../services/alarmService'
import { listMedia } from '../../services/mediaService'

function Consumer() {
  const { alarms, snoozeAlarm, updateAlarm, nextTriggerMs } = useAlarm()
  if (alarms.length === 0) return <div>no-data</div>
  const a = alarms[0]
  return (
    <div>
      <div data-testid="snooze">{a.snoozedUntil || ''}</div>
      <div data-testid="next">{String(nextTriggerMs(a))}</div>
      <button onClick={() => snoozeAlarm(a.id, 5)}>snooze5</button>
      <button onClick={() => updateAlarm(a.id, { snoozedUntil: null })}>cancel</button>
    </div>
  )
}

describe('AlarmContext – snooze & cancel', () => {
  const base: Alarm = {
    id: 'a1',
    name: 'Demo',
    enabled: true,
    intervalMinutes: 1,
    mediaId: undefined,
    imageId: undefined,
    snoozedUntil: null,
  }

  const flush = async () => {
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(0)
  }

  beforeEach(() => {
    // 👇 Timers falsos que avanzan solos y tiempo fijo
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))

    ;(listAlarms as unknown as Mock).mockResolvedValue([base])
    ;(listMedia  as unknown as Mock).mockResolvedValue([])
    ;(updateSnooze as unknown as Mock).mockResolvedValue({ success: true })
    ;(updateAlarmApi as unknown as Mock).mockImplementation(
    async (_id: string, patch: Partial<Alarm>) => ({ ...base, ...patch }),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  function mount() {
    return render(
      <AlarmProvider>
        <Consumer />
      </AlarmProvider>,
    )
  }

  it(
    'aplica snooze 5m y luego lo cancela',
    async () => {
      mount()
      await flush() // 👈 deja que cargue listAlarms/listMedia y se pinte

      // Espera a que el consumer tenga datos (desapareció "no-data")
      await waitFor(() => {
        expect(screen.queryByText('no-data')).not.toBeInTheDocument()
      })

      // Snooze 5 min
      await userEvent.click(screen.getByText('snooze5'))
      await flush()

      await waitFor(() => {
        expect(updateSnooze).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('snooze').textContent).not.toBe('')
      })

      const afterSnooze = Number(screen.getByTestId('next').textContent)
      expect(afterSnooze).toBeGreaterThanOrEqual(4 * 60_000)
      expect(afterSnooze).toBeLessThanOrEqual(5 * 60_000 + 1000)

      // Cancelar snooze
      await userEvent.click(screen.getByText('cancel'))
      await flush()

      await waitFor(() => {
        expect(screen.getByTestId('snooze').textContent).toBe('')
        const afterCancel = Number(screen.getByTestId('next').textContent)
        expect(afterCancel).toBeGreaterThan(50_000)
        expect(afterCancel).toBeLessThanOrEqual(60_000)
      })
    },
    10_000 // 👈 timeout extendido opcional
  )
})