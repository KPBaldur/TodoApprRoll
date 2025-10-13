import { useEffect, useMemo, useState } from 'react';
import type { Alarm } from '../services/alarmService';
import { listAlarms, createAlarm, updateAlarm, deleteAlarm } from '../services/alarmService';
import type { MediaItem } from '../services/mediaService';
import { listMedia } from '../services/mediaService';

export default function AlarmPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Form state
  const [name, setName] = useState('');
  const [time, setTime] = useState(''); // datetime-local
  const [enabled, setEnabled] = useState(true);
  const [mediaId, setMediaId] = useState<string | undefined>(undefined);
  const [intervalMinutesStr, setIntervalMinutesStr] = useState(''); // nuevo estado para minutos

  const audioMedia = useMemo(() => media.filter(m => m.type === 'audio'), [media]);

  // Buffer de ediciones por alarma (id -> patch parcial)
  const [pendingEdits, setPendingEdits] = useState<Record<string, Partial<Alarm>>>({});
  const getEdit = (id: string) => pendingEdits[id] ?? {};
  const setEdit = (id: string, patch: Partial<Alarm>) =>
    setPendingEdits(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const clearEdit = (id: string) =>
    setPendingEdits(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  async function handleSave(id: string) {
    const patch = pendingEdits[id];
    if (!patch) return;
    try {
      setLoading(true);
      const updated = await updateAlarm(id, patch);
      setAlarms(list => list.map(a => (a.id === id ? updated : a)));
      clearEdit(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const [now, setNow] = useState<number>(Date.now()); // estado para refrescar el timer
  const [timerAnchors, setTimerAnchors] = useState<Record<string, number>>({}); // anclas por alarma

  // Inicializa ancla para nuevas alarmas habilitadas (sin sobreescribir las existentes)
  useEffect(() => {
    setTimerAnchors(prev => {
      const next = { ...prev };
      for (const a of alarms) {
        if (a.enabled && next[a.id] === undefined) {
          next[a.id] = Date.now();
        }
      }
      return next;
    });
  }, [alarms]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000); // refresca cada segundo
    return () => clearInterval(id);
  }, []);

  function parseLocalDateTime(s: string): number | undefined {
    const str = (s || '').trim();
    if (!str) return undefined;
    const d = new Date(str);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : undefined;
  }

  function nextTriggerMs(alarm: Alarm): number | undefined {
    const nowMs = now;
    const timeMs = parseLocalDateTime(alarm.time || '');
    const intervalMs = alarm.intervalMinutes ? alarm.intervalMinutes * 60 * 1000 : undefined;

    // Caso: hay fecha base
    if (timeMs !== undefined) {
      let next = timeMs;
      if (intervalMs && next <= nowMs) {
        const diff = nowMs - next;
        const cycles = Math.floor(diff / intervalMs) + 1;
        next += cycles * intervalMs;
      }
      return next > nowMs ? next - nowMs : undefined;
    }

    // Caso: solo intervalo, sin fecha -> usar ancla
    if (intervalMs) {
      const anchor = timerAnchors[alarm.id] ?? nowMs; // si no hay ancla, comienza ahora
      const elapsed = nowMs - anchor;
      const remaining = intervalMs - (elapsed % intervalMs);
      return remaining;
    }

    return undefined;
  }

  function formatDuration(ms?: number): string {
    if (ms === undefined) return '—';
    if (ms <= 0) return '0s';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // Estado para controlar alarma activa y audio
  type ActiveAlarm = Alarm & { audioInstance?: HTMLAudioElement; mediaUrl?: string };
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  
  // Monitor de alarmas: chequea cada segundo y dispara cuando corresponde
  useEffect(() => {
      // Si hay una alarma activa, no disparamos otra hasta que se detenga
      if (activeAlarm) return;
  
      const checkAlarms = () => {
          alarms.forEach(alarm => {
              if (!alarm.enabled) return;
  
              const remaining = nextTriggerMs(alarm);
              if (remaining !== undefined && remaining <= 1000) {
                  triggerAlarm(alarm);
              }
          });
      };
  
      const interval = setInterval(checkAlarms, 1000);
      return () => clearInterval(interval);
  }, [alarms, now, activeAlarm]);
  
  // Carga inicial de alarmas y multimedia
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(undefined);
        const [alarmsData, mediaData] = await Promise.all([listAlarms(), listMedia()]);
        if (!cancelled) {
          setAlarms(alarmsData);
          setMedia(mediaData);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function triggerAlarm(alarm: Alarm) {
      // Busca el media asociado (audio o imagen/gif)
      const mediaItem = media.find(m => m.id === alarm.mediaId);

      // Imagen/GIF para mostrar en popup si aplica
      const isImage = !!mediaItem && (mediaItem.type?.startsWith('image') || mediaItem.type?.includes('gif'));
      const mediaUrl = isImage ? mediaItem?.path : undefined;

      // Audio en loop si aplica
      const isAudio = !!mediaItem && mediaItem.type?.startsWith('audio');
      if (isAudio && mediaItem?.path) {
          const audio = new Audio(mediaItem.path);
          audio.loop = true;
          audio.play().catch(err => {
              console.error('Error al reproducir audio:', err);
          });

          setActiveAlarm({
              ...alarm,
              audioInstance: audio,
              mediaUrl,
          });
      } else {
          // Sin audio: igual mostramos popup
          setActiveAlarm({
              ...alarm,
              mediaUrl,
          });
      }
  }
  
  function stopAlarm() {
      if (activeAlarm?.audioInstance) {
          try {
              activeAlarm.audioInstance.pause();
              activeAlarm.audioInstance.currentTime = 0;
          } catch (_) {
              // noop
          }
      }
      setActiveAlarm(null);
  }

  return (
    <section className="page">
      <h2 className="page-title">Alarmas</h2>
      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <details open style={{ marginBottom: 16 }}>
        <summary><strong>Crear alarma</strong></summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="panel-body" style={{ display: 'grid', gap: 8 }}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la alarma…" />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>Fecha y hora:</span>
              <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>Sonido (opcional):</span>
              <select
                value={mediaId ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  setMediaId(val === '' ? undefined : val);
                }}
                style={{ minWidth: 200 }}
              >
                <option value="">Sin sonido</option>
                {audioMedia.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>Recordatorio (minutos):</span>
              <input
                type="number"
                min={1}
                step={1}
                value={intervalMinutesStr}
                onChange={e => setIntervalMinutesStr(e.target.value)}
                placeholder="Ej: 30"
                style={{ width: 120 }}
              />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
              <span>Activada</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={handleCreate} disabled={loading}>
                Crear
              </button>
            </div>
          </div>
        </div>
      </details>

      <h3 className="section-title">Listado</h3>
      <ul className="task-list">
        {alarms.map(alarm => (
          <li key={alarm.id} className="task-item">
            <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge">{alarm.enabled ? 'ON' : 'OFF'}</span>
              <input
                type="text"
                defaultValue={alarm.name}
                onBlur={e => {
                  const next = e.target.value.trim();
                  if (next && next !== alarm.name) handleUpdate(alarm.id, { name: next });
                }}
                style={{ flex: 1 }}
                title="Escribe y quita el foco para renombrar"
              />
              <button
                className="btn"
                onClick={() => handleUpdate(alarm.id, { enabled: !alarm.enabled })}
                title="Activar/Desactivar"
              >
                {alarm.enabled ? 'Desactivar' : 'Activar'}
              </button>
              <button className="btn danger" onClick={() => handleDelete(alarm.id)}>Eliminar</button>
            </div>
            <div className="details" style={{ display: 'grid', gap: 8 }}>
              {/* Nombre controlado */}
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ opacity: 0.8 }}>Nombre:</span>
                <input
                  type="text"
                  value={(getEdit(alarm.id).name ?? alarm.name) || ''}
                  onChange={e => setEdit(alarm.id, { name: e.target.value })}
                />
              </label>

              {/* Fecha y hora controlado */}
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ opacity: 0.8 }}>Fecha y hora:</span>
                <input
                  type="datetime-local"
                  value={(getEdit(alarm.id).time ?? alarm.time) || ''}
                  onChange={e => setEdit(alarm.id, { time: e.target.value })}
                />
              </label>

              {/* Intervalo controlado */}
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ opacity: 0.8 }}>Recordatorio (minutos):</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={alarm.intervalMinutes ?? ''}
                  onBlur={e => {
                    const raw = e.target.value.trim();
                    const next = raw === '' ? undefined : Math.max(1, parseInt(raw, 10));
                    if (next !== alarm.intervalMinutes) {
                      handleUpdate(alarm.id, { intervalMinutes: next });
                    }
                  }}
                  placeholder="Ej: 30"
                  style={{ width: 120 }}
                />
              </label>

              {/* Botón Guardar cambios + indicador */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSave(alarm.id)}
                  disabled={!pendingEdits[alarm.id]}
                >
                  Guardar cambios
                </button>
                {pendingEdits[alarm.id] && (
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    Cambios sin guardar
                  </span>
                )}
              </div>

              {/* Timer visible */}
              <div style={{ opacity: 0.8, fontSize: 12 }}>
                Próximo en: {formatDuration(nextTriggerMs(alarm))}
              </div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>
                Sonido:{' '}
                {alarm.mediaId
                  ? audioMedia.find(m => m.id === alarm.mediaId)?.name ||
                    '(no encontrado)'
                  : 'Sin sonido'}
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ opacity: 0.8 }}>Sonido:</span>
                <select
                  value={alarm.mediaId ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    handleUpdate(alarm.id, { mediaId: val === '' ? undefined : val });
                  }}
                  style={{ minWidth: 200 }}
                >
                  <option value="">Sin sonido</option>
                  {audioMedia.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ opacity: 0.8, fontSize: 12 }}>
                Próximo en: {formatDuration(nextTriggerMs(alarm))}
              </div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>
                Sonido: {alarm.mediaId ? audioMedia.find(m => m.id === alarm.mediaId)?.name || '(no encontrado)' : 'Sin sonido'}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {alarms.length === 0 && <p style={{ opacity: 0.8 }}>No hay alarmas aún.</p>}
    </section>
  );

  // Crear una nueva alarma desde el formulario superior
  async function handleUpdate(id: string, patch: Partial<Alarm>) {
    try {
      setLoading(true);
      setError(undefined);
      const updated = await updateAlarm(id, patch);
      setAlarms(list => list.map(a => (a.id === id ? updated : a)));

      // Reinicia el ancla si se cambió hora, intervalo o se activó la alarma
      if (
        ('time' in patch) ||
        ('intervalMinutes' in patch) ||
        ('enabled' in patch && patch.enabled)
      ) {
        setTimerAnchors(prev => ({ ...prev, [id]: Date.now() }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      setError(undefined);
      await deleteAlarm(id);
      setAlarms(list => list.filter(a => a.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      setLoading(true);
      setError(undefined);

      const intervalMinutes =
        intervalMinutesStr.trim() === ''
          ? undefined
          : Math.max(1, parseInt(intervalMinutesStr, 10) || 1);

      const created = await createAlarm({
        name: name.trim() || 'Sin título',
        time,
        enabled,
        mediaId,
        intervalMinutes,
      });

      setAlarms(list => [...list, created]);

      // Limpia el formulario
      setName('');
      setTime('');
      setEnabled(true);
      setMediaId(undefined);
      setIntervalMinutesStr('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }
}