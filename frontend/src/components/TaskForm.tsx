import { useState } from "react";
import type { Priority } from "../services/tasks";
import type { Alarm } from "../services/alarmService";

type TaskFormProps = {
  alarms: Alarm[];
  onSubmit: (payload: {
    title: string;
    priority: Priority;
    description?: string;
    alarmId?: string | null;
  }) => Promise<void>;
};

const priorityOptions: { label: string; value: Priority }[] = [
  { label: "Prioridad baja", value: "low" },
  { label: "Prioridad media", value: "medium" },
  { label: "Prioridad alta", value: "high" },
];

export default function TaskForm({ alarms, onSubmit }: TaskFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [description, setDescription] = useState("");
  const [alarmId, setAlarmId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setPriority("medium");
    setDescription("");
    setAlarmId("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        priority,
        description: description.trim() || undefined,
        alarmId: alarmId || null,
      });
      reset();
      setExpanded(false);
    } catch (err: any) {
      setError(err.message || "No se pudo crear la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="create-card task-form">
      <button
        className="create-toggle"
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
      >
        Crear tarea <span className="chev">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="create-body">
          <div>
            <label>Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
            />
          </div>

          <div>
            <label>Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Descripción</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
            />
          </div>

          <div>
            <label>Asignar alarma (opcional)</label>
            {alarms.length === 0 ? (
              <p className="no-alarms">No hay alarmas disponibles</p>
            ) : (
              <select
                value={alarmId}
                onChange={(e) => setAlarmId(e.target.value)}
              >
                <option value="">Sin alarma</option>
                {alarms.map((alarm) => (
                  <option key={alarm.id} value={alarm.id}>
                    {alarm.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

