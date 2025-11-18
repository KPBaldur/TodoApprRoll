import {
  type ComponentType,
  type SVGProps,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArchiveBoxIcon,
  ArrowDownIcon,
  BellAlertIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Alarm } from "../services/alarms";
import type { Status, Task } from "../services/tasks";

type IconEntry = {
  color: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
};

const priorityVisual: Record<string, IconEntry> = {
  high: { color: "#F44336", Icon: ExclamationTriangleIcon, label: "Alta" },
  medium: { color: "#FFC107", Icon: FlagIcon, label: "Media" },
  low: { color: "#4CAF50", Icon: ArrowDownIcon, label: "Baja" },
};

const statusVisual: Record<string, IconEntry> = {
  pending: { color: "#f97316", Icon: ClockIcon, label: "Pendiente" },
  in_progress: { color: "#38bdf8", Icon: PlayCircleIcon, label: "Trabajando" },
  completed: { color: "#4ade80", Icon: CheckCircleIcon, label: "Completada" },
  archived: { color: "#ec4899", Icon: ArchiveBoxIcon, label: "Archivada" },
};

type TaskCardProps = {
  task: Task;
  priorityLabel: Record<string, string>;
  statusLabel: Record<string, string>;
  alarms: Alarm[];
  onChangeStatus: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onLinkAlarm: (taskId: string, alarmId: string | null) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTask: (
    taskId: string,
    payload: { title?: string; description?: string | null },
  ) => void;
};

export default function TaskCard({
  task,
  priorityLabel,
  statusLabel,
  alarms,
  onChangeStatus,
  onDelete,
  onLinkAlarm,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateTask,
}: TaskCardProps) {
  const normalizedPriority = String(task.priority).toLowerCase();
  const normalizedStatus = String(task.status).toLowerCase();

  const priorityInfo =
    priorityVisual[normalizedPriority as keyof typeof priorityVisual] ??
    priorityVisual.low;
  const statusInfo =
    statusVisual[normalizedStatus as keyof typeof statusVisual] ??
    statusVisual.pending;

  const PriorityIcon = priorityInfo.Icon;
  const StatusIcon = statusInfo.Icon;
  const statusDropdownClass = `input-with-icon dropdown status-control status-${normalizedStatus}`;
  const alarmDropdownClass = `input-with-icon dropdown alarm-control${
    alarms.length === 0 ? " disabled" : ""
  }`;

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description ?? "");
  }, [task.id, task.title, task.description]);

  const subtasks = useMemo(() => task.subtasks ?? [], [task.subtasks]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    try {
      await onUpdateTask(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim() ? editDesc.trim() : null,
      });
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      await onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask("");
    } finally {
      setAddingSubtask(false);
    }
  };

  return (
    <article className="task-card">
      <header className="task-card__header">
        <div className="task-card__title">
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título de la tarea"
            />
          ) : (
            <h3>{task.title}</h3>
          )}
        </div>
        <div className="task-card__pills">
          <span className="task-card__pill" style={{ color: priorityInfo.color }}>
            <PriorityIcon />
            <span>{priorityLabel[String(task.priority)] ?? priorityInfo.label}</span>
          </span>
          <span className="task-card__pill" style={{ color: statusInfo.color }}>
            <StatusIcon />
            <span>{statusLabel[String(task.status)] ?? statusInfo.label}</span>
          </span>
        </div>
      </header>

      <div className="task-card__controls">
        <label className={alarmDropdownClass}>
          <BellAlertIcon className="icon" aria-hidden />
          <select
            value={task.alarmId ?? ""}
            onChange={(e) => onLinkAlarm(task.id, e.target.value || null)}
            disabled={alarms.length === 0}
          >
            {alarms.length === 0 ? (
              <option value="">No hay alarmas creadas</option>
            ) : (
              <>
                <option value="">Sin alarma</option>
                {alarms.map((alarm) => (
                  <option key={alarm.id} value={alarm.id}>
                    {alarm.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </label>

        <label className={statusDropdownClass}>
          <StatusIcon className="icon" aria-hidden />
          <select
            value={normalizedStatus}
            onChange={(e) => onChangeStatus(task.id, e.target.value as Status)}
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">Trabajando</option>
            <option value="completed">Completada</option>
            <option value="archived">Archivada</option>
          </select>
        </label>

        <div className="task-card__actions">
          {editing ? (
            <>
              <button
                className="btn sm outline"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditTitle(task.title);
                  setEditDesc(task.description ?? "");
                }}
              >
                Cancelar
              </button>
              <button
                className="btn sm"
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "Guardando..." : "Guardar"}
              </button>
            </>
          ) : (
            <>
              {normalizedStatus !== "archived" && (
                <button
                  className="icon-btn archive"
                  type="button"
                  title="Archivar tarea"
                  onClick={() => onChangeStatus(task.id, "archived")}
                >
                  <ArchiveBoxIcon className="icon" style={{ color: "currentColor" }} />
                </button>
              )}
              {normalizedStatus === "archived" && (
                <button
                  className="icon-btn unarchive"
                  type="button"
                  title="Desarchivar tarea"
                  onClick={() => onChangeStatus(task.id, "pending")}
                >
                  <ArchiveBoxIcon className="icon" style={{ color: "currentColor" }} />
                </button>
              )}
              <button
                className="icon-btn edit"
                type="button"
                title="Editar tarea"
                onClick={() => setEditing(true)}
              >
                <PencilSquareIcon className="icon" style={{ color: "currentColor" }} />
              </button>
              <button
                className="icon-btn delete"
                type="button"
                title="Eliminar tarea"
                onClick={() => onDelete(task.id)}
              >
                <TrashIcon className="icon" style={{ color: "currentColor" }} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="task-card__description">
        {editing ? (
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Descripción de la tarea"
          />
        ) : (
          <p>{task.description || "Sin descripción disponible."}</p>
        )}
      </div>

      <div className="task-card__subtasks">
        <h4>SUBTAREAS</h4>
        {subtasks.length === 0 ? (
          <p className="subtasks-empty">Sin subtareas registradas</p>
        ) : (
          <ul className="subtask-list">
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className={`subtask-item ${subtask.done ? "completed" : ""}`}
              >
                <button
                  className="subtask-toggle"
                  type="button"
                  onClick={() =>
                    onToggleSubtask(task.id, subtask.id, !subtask.done)
                  }
                >
                  {subtask.done ? (
                    <CheckCircleIcon className="subtask-icon done" />
                  ) : (
                    <CircleStackIcon className="subtask-icon" />
                  )}
                </button>
                <span className={subtask.done ? "done" : ""}>{subtask.title}</span>
                <button
                  className="icon-btn delete"
                  type="button"
                  title="Eliminar subtarea"
                  onClick={() => onDeleteSubtask(task.id, subtask.id)}
                >
                  <TrashIcon className="icon" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="subtask-adder inline">
          <input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Nueva subtarea"
          />
          <button
            className="btn add-subtask"
            type="button"
            onClick={handleAddSubtask}
            disabled={addingSubtask}
          >
            <PlusCircleIcon className="icon" />{" "}
            {addingSubtask ? "Añadiendo..." : "Añadir subtarea"}
          </button>
        </div>
      </div>
    </article>
  );
}

