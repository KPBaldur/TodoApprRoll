import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Alarm } from '../services/alarmService'
import { listAlarms, createAlarm as createAlarmApi, updateAlarm as updateAlarmApi, deleteAlarm as deleteAlarmApi } from '../services/alarmService'

type AlarmContextValue = {
  alarms: Alarm[]
  loading: boolean
  error?: string
  activeAlarm: Alarm | null
  nextTriggerMs: (alarm: Alarm) => number | undefined
  triggerAlarm: (alarm: Alarm) => void
  stopAlarm: () => void
  createAlarm: (payload: Omit<Alarm, 'id'>) => Promise<Alarm>
  updateAlarm: (id: string, patch: Partial<Omit<Alarm, 'id'>>) => Promise<Alarm>
  deleteAlarm: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const AlarmContext = createContext<AlarmContextValue | undefined>(undefined)

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null)
  const [nowTick, setNowTick] = useState(0)
  const nowRef = useRef<number>(Date.now())
  const timerAnchorsRef = useRef<Record<string, number>>({})

  // NUEVO: refs persistentes para evitar cierres obsoletos y re-renders
  const activeRef = useRef<Alarm | null>(null)
  const alarmsRef = useRef<Alarm[]>([])
  const tickingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  

  // Mantener la lista en una ref (no depender de renders)
  useEffect(() => {
    alarmsRef.current = alarms
  }, [alarms])

  function triggerAlarm(alarm: Alarm) {
    activeRef.current = alarm
    setActiveAlarm(alarm)
    // Reinicia ancla para el siguiente ciclo
    timerAnchorsRef.current = { ...timerAnchorsRef.current, [alarm.id]: Date.now() }
  }

  function stopAlarm() {
    const current = activeRef.current
    if (current) {
      timerAnchorsRef.current = { ...timerAnchorsRef.current, [current.id]: Date.now() }
    }
    activeRef.current = null
    setActiveAlarm(null)
  }

  // Evaluación estable (usa refs, no estado)
  function checkAlarms() {
    if (activeRef.current) return // no disparar otra mientras hay una activa
    const list = alarmsRef.current
    for (const alarm of list) {
      if (!alarm.enabled) continue
      const remaining = nextTriggerMs(alarm)
      if (remaining !== undefined && remaining <= 1000) {
        triggerAlarm(alarm)
        break
      }
    }
  }

  // REEMPLAZO: único setInterval global sin dependencias
  useEffect(() => {
    if (tickingRef.current) return // evita recrear el intervalo
    tickingRef.current = setInterval(() => {
      nowRef.current = Date.now()
      checkAlarms()
    }, 1000)
    return () => {
      if (tickingRef.current) {
        clearInterval(tickingRef.current)
        tickingRef.current = null
      }
    }
  }, [])

  // Carga inicial de alarmas (backend con respaldo en localStorage)
  async function reload() {
    try {
      setLoading(true)
      setError(undefined)
      const data = await listAlarms()
      setAlarms(data)
      localStorage.setItem('alarms', JSON.stringify(data))
    } catch (err) {
      const cached = localStorage.getItem('alarms')
      if (cached) {
        try { setAlarms(JSON.parse(cached)) } catch {}
      }
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  // Inicializa ancla para nuevas alarmas habilitadas (sin sobreescribir existentes)
  useEffect(() => {
    const next = { ...timerAnchorsRef.current }
    const now = Date.now()
    for (const a of alarms) {
      if (a.enabled && next[a.id] === undefined) {
        next[a.id] = now
      }
    }
    timerAnchorsRef.current = next
  }, [alarms])

  // Pulso global de tiempo
  useEffect(() => {
    const id = setInterval(() => {
      nowRef.current = Date.now()
      setNowTick(t => (t + 1) % 1_000_000)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Cálculo de próximo disparo por intervalo
  function nextTriggerMs(alarm: Alarm): number | undefined {
    const nowMs = nowRef.current
    if (!alarm.enabled) return undefined
    if (activeAlarm && activeAlarm.id === alarm.id) return 0 // congelar mientras popup
    const intervalMs = alarm.intervalMinutes ? alarm.intervalMinutes * 60 * 1000 : undefined
    if (intervalMs) {
      const anchor = timerAnchorsRef.current[alarm.id] ?? nowMs
      const elapsed = nowMs - anchor
      const mod = elapsed % intervalMs
      const remainingExact = intervalMs - mod
      const remaining = remainingExact < 1000 ? 0 : remainingExact
      return remaining
    }
    return undefined
  }
  
  

  useEffect(() => {
    const id = setInterval(checkAlarms, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarms, activeAlarm, nowTick])

  // CRUD con actualización de anclas y persistencia
  async function createAlarm(payload: Omit<Alarm, 'id'>): Promise<Alarm> {
    const created = await createAlarmApi(payload)
    setAlarms(list => {
      const next = [...list, created]
      localStorage.setItem('alarms', JSON.stringify(next))
      return next
    })
    if (created.enabled) {
      timerAnchorsRef.current = { ...timerAnchorsRef.current, [created.id]: Date.now() }
    }
    return created
  }

  async function updateAlarm(id: string, patch: Partial<Omit<Alarm, 'id'>>): Promise<Alarm> {
    const updated = await updateAlarmApi(id, patch)
    setAlarms(list => {
      const next = list.map(a => (a.id === id ? updated : a))
      localStorage.setItem('alarms', JSON.stringify(next))
      return next
    })
    if (("intervalMinutes" in patch) || ("enabled" in patch && patch.enabled)) {
      timerAnchorsRef.current = { ...timerAnchorsRef.current, [id]: Date.now() }
    }
    return updated
  }

  async function deleteAlarm(id: string): Promise<void> {
    await deleteAlarmApi(id)
    setAlarms(list => {
      const next = list.filter(a => a.id !== id)
      localStorage.setItem('alarms', JSON.stringify(next))
      return next
    })
    const { [id]: _, ...rest } = timerAnchorsRef.current
    timerAnchorsRef.current = rest
  }

  const value: AlarmContextValue = {
    alarms,
    loading,
    error,
    activeAlarm,
    nextTriggerMs,
    triggerAlarm,
    stopAlarm,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    reload,
  }

  return (
    <AlarmContext.Provider value={value}>
      {children}
      {/* Popup global existente */}
      {activeAlarm && (
        <div
          className="alarm-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="alarm-popup"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 16,
              width: 'min(560px, 92vw)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>⏰ {activeAlarm.name}</div>
              <div style={{ opacity: 0.8 }}>Alarma activada</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn" onClick={stopAlarm}>Detener</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AlarmContext.Provider>
  )
}

export function useAlarm() {
  const ctx = useContext(AlarmContext)
  if (!ctx) throw new Error('useAlarm debe usarse dentro de AlarmProvider')
  return ctx
}