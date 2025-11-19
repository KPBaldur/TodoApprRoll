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
  const [mode, setMode] = useState<"date" | "cron">(initial?.cronExpr ? "cron" : "date");
  const [scheduleAt, setScheduleAt] = useState<string | null>(initial?.scheduleAt ?? null);
  const [cronExpr, setCronExpr] = useState<string | null>(initial?.cronExpr ?? null);
  const [snoozeMins, setSnoozeMins] = useState<number>(initial?.snoozeMins ?? 5);
  const [audioId, setAudioId] = useState<string>(initial?.audioId ?? "");
  const [imageId, setImageId] = useState<string>(initial?.imageId ?? "");
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [useTimer, setUseTimer] = useState(false);
  const [timerMins, setTimerMins] = useState<number>(5);

  const audioList = useMemo(() => media.filter((m) => m.type === "audio"), [media]);
  const imageList = useMemo(() => media.filter((m) => m.type === "image"), [media]);
  const selectedImage = useMemo(() => imageList.find((i) => i.id === imageId) || null, [imageList, imageId]);
  const selectedAudio = useMemo(() => audioList.find((a) => a.id === audioId) || null, [audioList, audioId]);

  const validate = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";
    if (useTimer) {
      if ((timerMins ?? 0) < 1) return "Temporizador mínimo 1 minuto";
      return null; // Saltar reglas de date/cron si hay temporizador
    }
    if (mode === "date" && !scheduleAt) return "Debe seleccionar fecha y hora";
    if (mode === "cron" && !cronExpr?.trim()) return "Debe ingresar una expresión cron";
    if (mode === "date" && cronExpr) return "Si se define fecha, cronExpr debe ser null";
    if (mode === "cron" && scheduleAt) return "Si cronExpr está definido, scheduleAt debe ser null";
    if ((snoozeMins ?? 0) < 1) return "Snooze mínimo 1 minuto";
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    setError("");

    const effectiveScheduleAt =
      useTimer
        ? new Date(Date.now() + timerMins * 60000).toISOString()
        : mode === "date"
        ? scheduleAt
        : null;

    const effectiveCronExpr = useTimer ? null : mode === "cron" ? cronExpr : null;

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
        {/* Columna izquierda: campos */}
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
              onClick={() => setMode("date")}
            >
              📅 Fecha específica
            </button>
            <button
              type="button"
              className={`toggle-btn ${mode === "cron" ? "active" : ""}`}
              onClick={() => setMode("cron")}
            >
              🔁 Cron
            </button>
            <button
              type="button"
              className={`toggle-btn ${useTimer ? "active" : ""}`}
              onClick={() => setUseTimer((v) => !v)}
            >
              ⏱️ Temporizador
            </button>
          </div>

          {mode === "date" ? (
            <div>
              <label className="form-label">Fecha y hora</label>
              <input
                type="datetime-local"
                className="input-modern"
                value={scheduleAt ?? ""}
                onChange={(e) => setScheduleAt(e.target.value || null)}
              />
            </div>
          ) : (
            <div>
              <label className="form-label">Expresión cron (ej: "0 8 * * *")</label>
              <input
                className="input-modern"
                value={cronExpr ?? ""}
                onChange={(e) => setCronExpr(e.target.value || null)}
                placeholder="m h * * *"
              />
            </div>
          )}

          {useTimer && (
            <div>
              <label className="form-label">Temporizador (minutos)</label>
              <input
                className="input-modern"
                type="number"
                min={1}
                value={timerMins}
                onChange={(e) => setTimerMins(Number(e.target.value))}
              />
            </div>
          )}

          <div className="grid-two">
            <div>
              <label className="form-label">Snooze (minutos)</label>
              <input
                className="input-modern"
                type="number"
                min={1}
                value={snoozeMins}
                onChange={(e) => setSnoozeMins(Number(e.target.value))}
              />
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

        {/* Columna derecha: preview */}
        <div className="alarm-form-right">
          <div className={`image-preview-card ${selectedImage ? "active" : ""}`}>
            {selectedImage ? (
              <>
                <img src={selectedImage.url} alt={selectedImage.name} />
                <div className="file-name">{selectedImage.name}</div>
              </>
            ) : (
              <div className="muted">Sin imagen seleccionada</div>
            )}
          </div>

          <div className="audio-preview-actions">
            <span className="muted">Reproductor de audio</span>
            {/* usa el player con estilos nuevos */}
          </div>
        </div>
      </div>
    </div>
  );
}