import { useState } from 'react';
import type { Alarm } from '../services/alarmService';
import { useAlarm } from '../context/AlarmContext';

export default function AlarmPage() {
  const { alarms, loading, error, nextTriggerMs, updateAlarm, deleteAlarm, createAlarm } = useAlarm();

  // Form state
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [intervalMinutesStr, setIntervalMinutesStr] = useState(''); // nuevo estado para minutos

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
    await updateAlarm(id, patch);
    clearEdit(id);
  }

  // nextTriggerMs proviene del contexto global

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

  // La monitorización y carga inicial ahora están centralizadas en el contexto

  // El popup y el control de parada están en el contexto global

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
            </div>
          </li>
        ))}
      </ul>
      {alarms.length === 0 && <p style={{ opacity: 0.8 }}>No hay alarmas aún.</p>}
    </section>
  );

  // Crear una nueva alarma desde el formulario superior
  async function handleUpdate(id: string, patch: Partial<Alarm>) {
    await updateAlarm(id, patch);
  }

  async function handleDelete(id: string) {
    await deleteAlarm(id);
  }

  async function handleCreate() {
    const intervalMinutes =
      intervalMinutesStr.trim() === ''
        ? undefined
        : Math.max(1, parseInt(intervalMinutesStr, 10) || 1);

    await createAlarm({
      name: name.trim() || 'Sin título',
      time: '',
      enabled,
      intervalMinutes,
    });

    // Limpia el formulario
    setName('');
    setEnabled(true);
    setIntervalMinutesStr('');
  }
}