import React, { useEffect, useState } from 'react';
import type { Alarm } from '../services/alarmService';
import { useAlarm } from '../context/AlarmContext';
import { listMedia } from '../services/mediaService';
import '../styles/alarm.css';

export default function AlarmPage() {
  const {
    alarms,
    loading,
    error,
    nextTriggerMs,
    updateAlarm,
    deleteAlarm,
    createAlarm,
    triggerAlarm,
    snoozeAlarm,
  } = useAlarm();

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // 🧱 Estados del formulario de creación
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [intervalMinutesStr, setIntervalMinutesStr] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [mediaId, setMediaId] = useState('');
  const [imageId, setImageId] = useState('');

  // 🧠 Cargar medios desde el backend
  useEffect(() => {
    async function loadMedia() {
      try {
        const mediaData = await listMedia();
        setMedia(mediaData);
      } catch (err) {
        console.error('Error al cargar medios:', err);
      }
    }
    loadMedia();
  }, []);

  // Buscar el medio seleccionado para previsualización
  const selectedMedia = media.find((m) => m.id === imageId);

  // 🧱 Buffer de ediciones
  const [pendingEdits, setPendingEdits] = useState<Record<string, Partial<Alarm>>>({});
  const getEdit = (id: string) => pendingEdits[id] ?? {};
  const setEdit = (id: string, patch: Partial<Alarm>) =>
    setPendingEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const clearEdit = (id: string) =>
    setPendingEdits((prev) => {
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

  async function handleUpdate(id: string, patch: Partial<Alarm>) {
    await updateAlarm(id, patch);
  }

  async function handleDelete(id: string) {
    await deleteAlarm(id);
  }

  async function handleCreate() {
    const intervalMinutes = Math.min(Number(intervalMinutesStr) || 1, 120);
    await createAlarm({
      name: name.trim() || 'Sin título',
      enabled,
      intervalMinutes,
      mediaId: mediaId || undefined,
      imageId: imageId || undefined, // ✅ Enviar imagen/GIF al backend
    });
    setName('');
    setEnabled(true);
    setIntervalMinutesStr('');
    setMediaId('');
    setImageId('');
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

  // Estados internos para edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState({
    mediaId: '',
    imageId: '',
    intervalMinutes: 30,
  });

  // Helpers
  function getMediaName(mid?: string) {
    const item = media.find((m) => m.id === mid);
    return item?.name ?? '';
  }

  function formatRemainingTime(alarm: Alarm) {
    return formatDuration(nextTriggerMs(alarm));
  }

  function toggleEnable(id: string) {
    const target = alarms.find((a) => a.id === id);
    if (!target) return;
    updateAlarm(id, { enabled: !target.enabled });
  }

  async function saveEdit(id: string) {
    await updateAlarm(id, {
      mediaId: editModel.mediaId || undefined,
      imageId: editModel.imageId || undefined,
      intervalMinutes: editModel.intervalMinutes,
    });
    setEditingId(null);
  }

  return (
    <section className="page">
      <h2 className="page-title">Alarmas</h2>
      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <details open style={{ marginBottom: 16 }}>
        <summary><strong>Crear alarma</strong></summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la alarma…"
            />

            {/* 🎵 Audio */}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>Audio:</span>
              <select
                value={mediaId}
                onChange={(e) => setMediaId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Sin sonido</option>
                {media
                  .filter((m) => m.type === 'audio')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>

            {/* 🖼️ Imagen o GIF */}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>Imagen / GIF / Video:</span>
              <select
                value={imageId}
                onChange={(e) => setImageId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Sin imagen</option>
                {media
                  .filter((m) => m.type === 'image' || m.type === 'video')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>

            {/* 🎬 Vista previa */}
            {imageId && selectedMedia && (
              <div className="preview-container" style={{ textAlign: 'center' }}>
                {selectedMedia.type === 'video' ? (
                  <video
                    src={`${API_BASE}${selectedMedia.path}`}
                    autoPlay
                    loop
                    muted
                    style={{ maxHeight: 180, borderRadius: 8 }}
                  />
                ) : (
                  <img
                    src={`${API_BASE}${selectedMedia.path}`}
                    alt="Vista previa"
                    style={{ maxHeight: 180, borderRadius: 8 }}
                  />
                )}
              </div>
            )}

            {/* ⏱️ Tiempo */}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>Recordatorio (minutos):</span>
              <input
                type="number"
                min={1}
                step={1}
                value={intervalMinutesStr}
                onChange={(e) => setIntervalMinutesStr(e.target.value)}
                placeholder="Ej: 30"
                style={{ width: 120 }}
              />
            </label>

            {/* 🔘 Activación */}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
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

      {/* 🧾 Listado de alarmas */}
      <h3 className="section-title">Listado</h3>
      <ul className="task-list">
        {alarms.map(alarm => (
          <li key={alarm.id} className={`alarm-item ${alarm.enabled ? 'is-on' : 'is-off'}`}>
            <div className="alarm-header">
              <div className="alarm-status">
                <span className={`status-dot ${alarm.enabled ? 'on' : 'off'}`}></span>
                <span className="alarm-icon">{alarm.mediaId ? '🎧' : '🔔'}</span>
                <strong>{alarm.name}</strong>
              </div>

              <div className="alarm-controls">
                <button className="btn small" onClick={() => toggleEnable(alarm.id)}>
                  {alarm.enabled ? 'Desactivar' : 'Activar'}
                </button>
                <button className="btn danger small" onClick={() => deleteAlarm(alarm.id)}>Eliminar</button>
                <button className="btn small" onClick={() => triggerAlarm(alarm)}>Probar</button>
                <button className="btn small" onClick={() => snoozeAlarm(alarm.id, 5)}>Snooze 5m</button>
                <button
                  className="btn small"
                  onClick={() => {
                    setEditingId(alarm.id);
                    setEditModel({
                      mediaId: alarm.mediaId || '',
                      imageId: alarm.imageId || '',
                      intervalMinutes: alarm.intervalMinutes || 30,
                    });
                  }}
                >
                  🖊️ Editar
                </button>
              </div>
            </div>

            {/* Vista modo lectura */}
            {editingId !== alarm.id && (
              <div className="alarm-info">
                <p><b>Audio:</b> {alarm.mediaId ? getMediaName(alarm.mediaId) : 'Sin sonido'}</p>
                <p><b>Imagen / GIF:</b> {alarm.imageId ? getMediaName(alarm.imageId) : 'Sin imagen'}</p>
                <p><b>Recordatorio:</b> {alarm.intervalMinutes} min</p>
                <p className="next-time">⏱ Próximo en: {formatRemainingTime(alarm)}</p>
              </div>
            )}

            {/* Vista modo edición */}
            {editingId === alarm.id && (
              <div className="alarm-edit">
                <label>Audio:</label>
                <select
                  value={editModel.mediaId}
                  onChange={(e) => setEditModel({ ...editModel, mediaId: e.target.value })}
                >
                  <option value="">Sin sonido</option>
                  {media.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <label>Imagen / GIF / Video:</label>
                <select
                  value={editModel.imageId}
                  onChange={(e) => setEditModel({ ...editModel, imageId: e.target.value })}
                >
                  <option value="">Sin imagen</option>
                  {media.filter(m => m.type !== 'audio').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <label>Recordatorio (minutos):</label>
                <input
                  type="number"
                  value={editModel.intervalMinutes}
                  onChange={(e) => setEditModel({ ...editModel, intervalMinutes: +e.target.value })}
                />

                <div className="edit-actions">
                  <button className="btn small" onClick={() => saveEdit(alarm.id)}>Guardar</button>
                  <button className="btn small" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {alarms.length === 0 && <p style={{ opacity: 0.8 }}>No hay alarmas aún.</p>}
    </section>
  );
}
