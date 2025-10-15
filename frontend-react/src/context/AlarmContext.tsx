import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Alarm } from '../services/alarmService'
import { listAlarms, createAlarm as createAlarmApi, updateAlarm as updateAlarmApi, deleteAlarm as deleteAlarmApi } from '../services/alarmService'
import { listMedia } from '../services/mediaService'
import { updateSnooze } from '../services/alarmService' // integrar API de snooze

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type AlarmContextValue = {
  alarms: Alarm[]
  loading: boolean
  error?: string
  activeAlarm: Alarm | null
  nextTriggerMs: (alarm: Alarm) => number | undefined
  triggerAlarm: (alarm: Alarm) => void
  stopAlarm: () => void
  snoozeAlarm: (id: string, minutes: number) => Promise<void> // firma nueva
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

  const nowRef = useRef<number>(Date.now())
  const timerAnchorsRef = useRef<Record<string, number>>({})
  const activeRef = useRef<Alarm | null>(null)
  const alarmsRef = useRef<Alarm[]>([])
  const mediaRef = useRef<any[]>([])
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const tickingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [tick, setTick] = useState(0)

  // 🔁 Mantener la lista de alarmas actualizada en la ref
  useEffect(() => {
    alarmsRef.current = alarms
  }, [alarms])

  // 🔔 Reproduce el audio asociado a la alarma
  function triggerAlarm(alarm: Alarm) {
    console.log("🚨 Se intentará activar alarma:", alarm)
    console.log("🎵 mediaRef.current:", mediaRef.current)
    console.log("🔍 alarm.mediaId:", alarm.mediaId)

    activeRef.current = alarm
    setActiveAlarm(alarm)

    const mediaItem = mediaRef.current.find(m => m.id === alarm.mediaId)
    const isAudio = mediaItem?.type?.startsWith('audio')
    const mediaUrl = isAudio 
      ? (mediaItem.path.startsWith('/uploads/')
        ? `${API_BASE}${mediaItem.path}`
        : `${API_BASE}/uploads/${mediaItem.path}`)
      : undefined

    if (isAudio && mediaUrl) {
      const audio = new Audio(mediaUrl)
      audio.loop = true
      audio.volume = 0.9
      audio.play().catch(err => console.error('Error al reproducir audio:', err))
      activeAudioRef.current = audio
    }

    // Reinicia ancla de tiempo para el siguiente ciclo
    timerAnchorsRef.current = { ...timerAnchorsRef.current, [alarm.id]: Date.now() }
  }

  // 🔇 Detiene la alarma y reinicia su ancla
  function stopAlarm() {
    const current = activeRef.current
    if (current) {
      timerAnchorsRef.current = {
        ...timerAnchorsRef.current,
        [current.id]: Date.now() // Reinicia ancla de tiempo
      }
    }

    const audio = activeAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      activeAudioRef.current = null
    }

    activeRef.current = null
    setActiveAlarm(null)
  }

  // 🔔 Snooze la alarma por X minutos
    async function snoozeAlarm(id: string, minutes: number): Promise<void> {
    const current = alarmsRef.current.find(a => a.id === id)
    if (!current) return

    // Detenemos el audio y el popup
    stopAlarm()

    // Calculamos la nueva hora de snooze
    const snoozeTime = new Date(Date.now() + minutes * 60000)
    const snoozeIso = snoozeTime.toISOString()

    try {
      // Persistir en backend
      await updateSnooze(id, snoozeIso)

      // Actualizar en estado local
      setAlarms(prev =>
        prev.map(a => a.id === id ? { ...a, snoozedUntil: snoozeIso } : a)
      )

      console.log(`😴 Alarma "${current.name}" pospuesta hasta ${snoozeIso}`)
    } catch (err) {
      console.error('Error al persistir el snooze:', err)
    }
  }

  // 🔍 Verifica si alguna alarma debe activarse
  function checkAlarms() {
    if (activeRef.current) return // Evita múltiples activaciones simultáneas
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

  // ⏱️ Intervalo global — controla tiempo, refresca UI y evalúa alarmas
  useEffect(() => {
    if (tickingRef.current) return
    tickingRef.current = setInterval(() => {
      nowRef.current = Date.now()
      setTick(t => (t + 1) % 1000000) // Fuerza render cada segundo
      checkAlarms()
    }, 1000)
    return () => {
      if (tickingRef.current) {
        clearInterval(tickingRef.current)
        tickingRef.current = null
      }
    }
  }, [])

  // 🔄 Carga inicial de alarmas y medios
  async function reload() {
    try {
      setLoading(true)
      setError(undefined)
      const [alarmsData, mediaData] = await Promise.all([
        listAlarms(),
        listMedia()
      ])
      setAlarms(alarmsData)
      mediaRef.current = mediaData
      localStorage.setItem('alarms', JSON.stringify(alarmsData))
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

  // Inicializa anclas para alarmas activas
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

  // 🧮 Cálculo del tiempo restante
  function nextTriggerMs(alarm: Alarm): number | undefined {
    const nowMs = nowRef.current
    if (!alarm.enabled) return undefined
    if (activeAlarm && activeAlarm.id === alarm.id) return 0

    // Si está snoozeada y el tiempo aún no llega, respetar snooze
    if (alarm.snoozedUntil) {
      const at = Date.parse(alarm.snoozedUntil)
      if (!Number.isNaN(at)) {
        const diff = at - nowMs
        if (diff > 0) return diff
        // si ya pasó la hora de snooze, continuar con la lógica habitual
      }
    }

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

  // 🧱 CRUD con persistencia
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
    snoozeAlarm, // expone función para UI/popup
    createAlarm,
    updateAlarm,
    deleteAlarm,
    reload,
  }


  // 🪟 Popup visual de alarma
  return (
    <AlarmContext.Provider value={value}>
      {children}
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
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>⏰ {activeAlarm.name}</div>
            <div style={{ opacity: 0.8 }}>Alarma activada</div>

            {/* 🖼️ Imagen o GIF asociada */}
            {(() => {
              const mediaItem = mediaRef.current.find(m => m.id === activeAlarm.imageId);
              if (!mediaItem) return null;

              let src = mediaItem.path;
              if (!src.startsWith('http')) {
                if (src.startsWith('/uploads/')) {
                  src = `${API_BASE}${src}`;
                } else {
                  src = `${API_BASE}/uploads/${src}`;
                }
              }

              if (mediaItem.type === 'image' || mediaItem.type === 'gif') {
                return (
                  <img
                    src={src}
                    alt={mediaItem.name}
                    style={{ maxHeight: 260, borderRadius: 8, objectFit: 'contain', margin: '0 auto' }}
                  />
                );
              }
              if (mediaItem.type === 'video') {
                return (
                  <video
                    src={src}
                    autoPlay
                    loop
                    muted
                    style={{ maxHeight: 260, borderRadius: 8, objectFit: 'contain', margin: '0 auto' }}
                  />
                );
              }
              return null;
            })()}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={stopAlarm}>Detener</button>
              <button className="btn" onClick={() => snoozeAlarm(activeAlarm.id, 5)}>Posponer 5 min</button>
              <button className="btn" onClick={() => snoozeAlarm(activeAlarm.id, 10)}>Posponer 10 min</button>
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
