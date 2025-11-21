/* import React, { useMemo, useState } from "react";*/
import type {
  Alarm,
  AlarmCreatePayload,
  AlarmUpdatePayload,
  Media,
} from "../../services/alarmService";

type Props = {
  initial?: Alarm | null;
  media: Media[];
  onSubmit: (payload: AlarmCreatePayload | AlarmUpdatePayload) => Promise<void>;
  onCancel?: () => void;
};

const defaultSnooze = 25;
const snoozeOptions = [5, 10, 15, 20, 25, 30, 45, 60];

export default function AlarmForm({ initial, media, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [snoozeMins, setSnoozeMins] = useState<number>(
    initial?.snoozeMins ?? defaultSnooze
  );
  const [audioId, setAudioId] = useState<string>(initial?.audioId ?? "");
  const [imageId, setImageId] = useState<string>(initial?.imageId ?? "");
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const audioList = useMemo(() => media.filter((m) => m.type === "audio"), [media]);
  const imageList = useMemo(() => media.filter((m) => m.type === "image"), [media]);

  const validate = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";
    if (snoozeMins < 1) return "El Pomodoro debe ser de al menos 1 minuto";
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError("");

    const payload: AlarmCreatePayload | AlarmUpdatePayload = {
      name: name.trim(),
      snoozeMins,
      audioId: audioId || null,
      imageId: imageId || null,
      enabled,
    };

    try {
      await onSubmit(payload);
      setSubmitting(false);
    } catch (e: any) {
      setError(e.message || "Error al guardar alarma");
      setSubmitting(false);
    }
  };

  return (
    <div className="alarm-form">
      <div className="alarm-form-grid">
        <div className="alarm-form-left">
          <div>
            <label className="form-label">Nombre</label>
            <input
              className="input-modern"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pomodoro de enfoque"
            />
          </div>

          <div className="grid-two">
            <div>
              <label className="form-label">Duración (min)</label>
              <select
                className="select-modern"
                value={snoozeMins}
                onChange={(e) => setSnoozeMins(Number(e.target.value))}
              >
                {snoozeOptions.map((m) => (
                  <option key={m}>{m}</option>
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
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
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
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="alarm-form-actions">
            <button className="btn btn-green" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            {onCancel && (
              <button className="btn btn-muted" onClick={onCancel}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="alarm-form-right">
          <div className="image-preview-card">
            {imageId ? (
              <div className="file-name">
                {imageList.find((i) => i.id === imageId)?.name ?? "Sin imagen"}
              </div>
            ) : (
              <div className="file-name">Sin imagen</div>
            )}
          </div>
          <span className="muted">Audio: {audioList.find((a) => a.id === audioId)?.name ?? "Ninguno"}</span>
        </div>
      </div>
    </div>
  );
}
