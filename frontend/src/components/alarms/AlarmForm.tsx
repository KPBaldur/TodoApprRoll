// Reescritura completa del formulario para modos: fecha, cron, temporizador.
// Convierte datetime-local a ISO, genera scheduleAt para temporizador,
// y asegura exclusiones entre modos.
import React, { useMemo, useState } from "react";
import type { Alarm, AlarmCreatePayload, AlarmUpdatePayload, Media } from "../../services/alarmService";

type Props = {
  initial?: Alarm | null;
  media: Media[];
  onSubmit: (payload: AlarmCreatePayload | AlarmUpdatePayload) => Promise<void>;
  onCancel?: () => void;
};

const snoozeOptions = [5, 10, 15, 30, 60];

export default function AlarmForm({ initial, media, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mode, setMode] = useState<"date" | "cron" | "timer">(initial?.cronExpr ? "cron" : initial?.scheduleAt ? "date" : "date");
  const [scheduleAt, setScheduleAt] = useState<string | null>(initial?.scheduleAt ?? null);
  const [cronExpr, setCronExpr] = useState<string | null>(initial?.cronExpr ?? null);
  const [snoozeMins, setSnoozeMins] = useState<number>(initial?.snoozeMins ?? 5);
  const [timerMins, setTimerMins] = useState<number>(5);
  const [audioId, setAudioId] = useState<string>(initial?.audioId ?? "");
  const [imageId, setImageId] = useState<string>(initial?.imageId ?? "");
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const audioList = useMemo(() => media.filter((m) => m.type === "audio"), [media]);
  const imageList = useMemo(() => media.filter((m) => m.type === "image"), [media]);

  const validate = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";

    if (mode === "timer") {
      if ((timerMins ?? 0) < 1) return "Temporizador mínimo 1 minuto";
      if ((snoozeMins ?? 0) < 1) return "Snooze mínimo 1 minuto";
      return null;
    }

    if (mode === "date") {
      if (!scheduleAt) return "Debe seleccionar fecha y hora";
      if (cronExpr) return "Si hay fecha, cronExpr debe ser null";
    }

    if (mode === "cron") {
      if (!cronExpr?.trim()) return "Debe ingresar una expresión cron";
      if (scheduleAt) return "Si hay cronExpr, scheduleAt debe ser null";
    }

    if ((snoozeMins ?? 0) < 1) return "Snooze mínimo 1 minuto";
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    setError("");

    // Resolver valores efectivos según el modo
    const effectiveScheduleAt =
      mode === "timer"
        ? new Date(Date.now() + timerMins * 60000).toISOString()
        : mode === "date"
        ? scheduleAt
          ? new Date(scheduleAt).toISOString()
          : null
        : null;

    const effectiveCronExpr = mode === "cron" ? (cronExpr ?? null) : null;

    const payload: AlarmCreatePayload | AlarmUpdatePayload = {
      name: name.trim(),
      scheduleAt: effectiveScheduleAt,
      cronExpr: effectiveCronExpr,
      snoozeMins,
      audioId: audioId || null,
      imageId: imageId || null,
      enabled,
    };

    try {
      await onSubmit(payload);
      setSubmitting(false);
    } catch (e: any) {
      setSubmitting(false);
      setError(e.message || "Error al guardar la alarma");
    }
  };

  return (
    <div className="alarm-form">
      <div className="alarm-form-grid">
        <div className="alarm-form-left">
          <div>
            <label className="form-label">Nombre de alarma</label>
            <input
              className="input-modern"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alarma de la mañana"
            />
          </div>

          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${mode === "date" ? "active" : ""}`}
              onClick={() => { setMode("date"); setCronExpr(null); }}
            >
              📅 Fecha específica
            </button>
            <button
              type="button"
              className={`toggle-btn ${mode === "cron" ? "active" : ""}`}
              onClick={() => { setMode("cron"); setScheduleAt(null); }}
            >
              🔁 Cron
            </button>
            <button
              type="button"
              className={`toggle-btn ${mode === "timer" ? "active" : ""}`}
              onClick={() => { setMode("timer"); setScheduleAt(null); setCronExpr(null); }}
            >
              ⏱️ Temporizador
            </button>
          </div>

          {mode === "date" && (
            <div>
              <label className="form-label">Fecha y hora</label>
              <input
                type="datetime-local"
                className="input-modern"
                value={scheduleAt ? new Date(scheduleAt).toISOString().slice(0, 16) : ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw) {
                    const dt = new Date(raw);
                    setScheduleAt(dt.toISOString()); // ISO con timezone
                  } else {
                    setScheduleAt(null);
                  }
                }}
              />
            </div>
          )}

          {mode === "cron" && (
            <div>
              <label className="form-label">Expresión cron (ej: "*/1 * * * *")</label>
              <input
                className="input-modern"
                value={cronExpr ?? ""}
                onChange={(e) => setCronExpr(e.target.value || null)}
                placeholder="m h * * *"
              />
            </div>
          )}

          {mode === "timer" && (
            <div>
              <label className="form-label">Temporizador (minutos)</label>
              <input
                className="input-modern"
                type="number"
                min={1}
                value={timerMins}
                onChange={(e) => setTimerMins(Number(e.target.value))}
              />
              <p className="muted">Se programará ahora + {timerMins} minutos</p>
            </div>
          )}

          <div className="grid-two">
            <div>
              <label className="form-label">Snooze (minutos)</label>
              <select
                className="select-modern"
                value={snoozeMins}
                onChange={(e) => setSnoozeMins(Number(e.target.value))}
              >
                {snoozeOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="checkbox-row">
              <label className="form-label">Activa</label>
              <input
                type="checkbox"
                className="checkbox-modern"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            </div>
          </div>

          <div className="grid-two">
            <div>
              <label className="form-label">Imagen</label>
              <select
                className="select-modern"
                value={imageId}
                onChange={(e) => setImageId(e.target.value)}
              >
                <option value="">Sin imagen</option>
                {imageList.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Audio</label>
              <select
                className="select-modern"
                value={audioId}
                onChange={(e) => setAudioId(e.target.value)}
              >
                <option value="">Sin audio</option>
                {audioList.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="alarm-form-actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-green"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-muted"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </div>

        {/* Preview derecha mínima */}
        <div className="alarm-form-right">
          <div className="image-preview-card">
            <div className="file-name">Imagen seleccionada: {imageList.find((i) => i.id === imageId)?.name ?? "Ninguna"}</div>
          </div>
          <div className="audio-preview-actions">
            <span className="muted">Audio: {audioList.find((a) => a.id === audioId)?.name ?? "Ninguno"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}