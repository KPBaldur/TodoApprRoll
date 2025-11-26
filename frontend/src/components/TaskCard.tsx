import { useState, useEffect } from "react";
import {
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { Task, Status } from "../services/tasks";
import type { Alarm } from "../services/alarmService";

// Definición de colores y etiquetas para Prioridad
const priorityVisual = {
  low: { color: "#10b981", label: "Baja", Icon: CheckCircleIcon },
  medium: { color: "#f59e0b", label: "Media", Icon: ClockIcon },
  high: { color: "#ef4444", label: "Alta", Icon: ExclamationTriangleIcon },
};

// Definición de colores y etiquetas para Estado
const statusVisual = {
  pending: { color: "#6b7280", label: "Pendiente", Icon: CircleStackIcon },
  in_progress: { color: "#3b82f6", label: "En Curso", Icon: ClockIcon },
  completed: { color: "#10b981", label: "Completada", Icon: CheckCircleIcon },
  archived: { color: "#8b5cf6", label: "Archivada", Icon: ArchiveBoxIcon },
};

type TaskCardProps = {
  task: Task;
  priorityLabel: Record<string, string>;
  statusLabel: Record<string, string>;
  alarms: Alarm[];
  onChangeStatus: (taskId: string, newStatus: Status) => void;
  onDelete: (taskId: string) => void;
  onLinkAlarm: (taskId: string, alarmId: string | null) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTask: (
    taskId: string,
    payload: { title?: string; description?: string | null; completionNote?: string | null },
  ) => void;
  onReorderSubtasks?: (taskId: string, subtasks: any[]) => void;
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
  onReorderSubtasks,
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
  const alarmDropdownClass = `input-with-icon dropdown alarm-control${alarms.length === 0 ? " disabled" : ""}`;

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Estados para nota de finalización
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(task.completionNote || "");

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description ?? "");
    setNoteText(task.completionNote || "");
  }, [task]);

  async function handleSaveEdit() {
    setSavingEdit(true);
    try {
      await onUpdateTask(task.id, { title: editTitle, description: editDesc });
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleAddSubtask() {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      await onAddSubtask(task.id, newSubtask);
      setNewSubtask("");
    } finally {
      setAddingSubtask(false);
    }
  }

  function handleSubtaskDragEnd(result: any) {
    if (!result.destination || !onReorderSubtasks) return;
    const items = Array.from(task.subtasks || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistic update visual lo manejaría el padre si actualiza el estado rápido,
    // pero aquí llamamos a la función de reordenamiento
    onReorderSubtasks(task.id, items);
  }

  const subtasks = task.subtasks || [];

  return (
    <article className={`task-card ${normalizedStatus} ${collapsed ? 'collapsed' : ''}`}>
      <header className="task-card__header">
        <div className="task-card__title-row">
          <div className="collapse-toggle-container">
            <button
              className="collapse-toggle"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expandir tarea" : "Colapsar tarea"}
            >
              {collapsed ? (
                <ChevronDownIcon className="icon" />
              ) : (
                <ChevronUpIcon className="icon" />
              )}
            </button>
          </div>

          <div className="task-card__title-content">
            {editing ? (
              <input
                className="edit-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título de la tarea"
                autoFocus
              />
            ) : (
              <h3>{task.title}</h3>
            )}
          </div>
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

      {/* Fecha de completado y Nota de Finalización */}
      {(normalizedStatus === "completed" || normalizedStatus === "archived") && (
        <div style={{ marginTop: "0.5rem", marginLeft: "1rem", marginRight: "1rem" }}>
          {task.completedAt && (
            <div className="task-card__completed-date" style={{ fontSize: "0.8rem", color: "#666" }}>
              Completada el: {new Date(task.completedAt).toLocaleDateString()} {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* Nota de Finalización */}
          <div style={{ marginTop: "0.5rem" }}>
            {isEditingNote ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Añade un comentario sobre cómo finalizó la tarea..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#2a2a2a',
                    color: '#fff',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setIsEditingNote(false);
                      setNoteText(task.completionNote || "");
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onUpdateTask(task.id, { completionNote: noteText });
                      setIsEditingNote(false);
                    }}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Guardar Nota
                  </button>
                </div>
              </div>
            ) : (
              task.completionNote ? (
                <div
                  onClick={() => setIsEditingNote(true)}
                  title="Clic para editar nota"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#ddd',
                    borderLeft: '3px solid #10b981',
                    cursor: 'pointer'
                  }}
                >
                  <strong>Nota:</strong> {task.completionNote}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNoteText("");
                    setIsEditingNote(true);
                  }}
                  style={{
                    fontSize: '0.8rem',
                    color: '#3b82f6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  + Añadir nota de finalización
                </button>
              )
            )}
          </div>
        </div>
      )}

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
            {/* Solo permitir seleccionar Archivada si ya está completada o archivada */}
            <option
              value="archived"
              disabled={normalizedStatus !== "completed" && normalizedStatus !== "archived"}
            >
              Archivada {normalizedStatus !== "completed" && normalizedStatus !== "archived" ? "(Requiere completar)" : ""}
            </option>
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
              {/* Botón Archivar: Solo visible si está COMPLETADA */}
              {normalizedStatus === "completed" && (
                <button
                  className="icon-btn archive"
                  type="button"
                  title="Archivar tarea (Completada)"
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
                  onClick={() => onChangeStatus(task.id, "completed")}
                >
                  {/* Al desarchivar vuelve a completada para mantener coherencia */}
                  <ArchiveBoxIcon className="icon" style={{ color: "currentColor" }} />
                </button>
              )}

              <button
                className="icon-btn edit"
                type="button"
                title="Editar tarea"
                onClick={() => setEditing(true)}
              >
                <PencilSquareIcon className="icon" />
              </button>
              <button
                className="icon-btn delete"
                type="button"
                title="Eliminar tarea"
                onClick={() => onDelete(task.id)}
              >
                <TrashIcon className="icon" />
              </button>
            </>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
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
              <DragDropContext onDragEnd={handleSubtaskDragEnd}>
                <Droppable droppableId={`subtasks-${task.id}`}>
                  {(provided) => (
                    <ul className="subtask-list" {...provided.droppableProps} ref={provided.innerRef}>
                      {subtasks.map((subtask, index) => (
                        <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
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
        </>
      )}
    </article>
  );
}