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

  const audioList = useMemo(() => media.filter((m) => m.type === "audio"), [media]);
  const imageList = useMemo(() => media.filter((m) => m.type === "image"), [media]);

  const validate = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";
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

    const payload: AlarmCreatePayload | AlarmUpdatePayload = {
      name: name.trim(),
      scheduleAt: mode === "date" ? scheduleAt : null,
      cronExpr: mode === "cron" ? cronExpr : null,
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-slate-200">Nombre</label>
        <input
          className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alarma de la mañana"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          className={`px-3 py-1 rounded ${mode === "date" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200"}`}
          onClick={() => setMode("date")}
        >
          📅 Fecha específica
        </button>
        <button
          type="button"
          className={`px-3 py-1 rounded ${mode === "cron" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200"}`}
          onClick={() => setMode("cron")}
        >
          🔁 Cron
        </button>
      </div>

      {mode === "date" ? (
        <div>
          <label className="block text-sm text-slate-200">Fecha y hora</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
            value={scheduleAt ?? ""}
            onChange={(e) => setScheduleAt(e.target.value || null)}
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm text-slate-200">Expresión cron (ej: "0 8 * * *")</label>
          <input
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
            value={cronExpr ?? ""}
            onChange={(e) => setCronExpr(e.target.value || null)}
            placeholder="m h * * *"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-200">Audio</label>
          <select
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
            value={audioId}
            onChange={(e) => setAudioId(e.target.value)}
          >
            <option value="">Sin audio</option>
            {audioList.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-200">Imagen</label>
          <select
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
            value={imageId}
            onChange={(e) => setImageId(e.target.value)}
          >
            <option value="">Sin imagen</option>
            {imageList.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-sm text-slate-200">Snooze</label>
          <select
            className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
            value={snoozeMins}
            onChange={(e) => setSnoozeMins(Number(e.target.value))}
          >
            {snoozeOptions.map((n) => (
              <option key={n} value={n}>{n} mins</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-200">Enabled</label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>
      </div>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 rounded bg-green-600 text-white hover:opacity-90"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-slate-700 text-slate-200"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}