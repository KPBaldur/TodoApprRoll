// src/pages/Dashboard.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  updateTask,
  linkAlarm,
} from "../services/tasks";
import type { Task, Priority, Status } from "../services/tasks";
import { getAlarms } from "../services/alarmService";
import type { Alarm } from "../services/alarmService";
import "../styles/dashboard.css";

// 🔔 SSE alarm events
import useAlarmEvents from "../hooks/useAlarmEvents";
import { useAlarmPopup } from "../components/alarms/AlarmProvider";

const priorityLabel: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  archived: "Archivada",
  PENDING: "Pendiente",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  ARCHIVED: "Archivada",
};

export default function Dashboard() {
  // -------------------------------------------------------
  // 🔔 INTEGRACIÓN SSE + POPUP DE ALARMAS
  // -------------------------------------------------------
  const { enqueueAlarmTrigger } = useAlarmPopup();

  const onAlarm = useCallback((payload: any) => {
  console.log("🔔 SSE recibido:", payload);

  enqueueAlarmTrigger({
    id: payload.id,
    name: payload.name,
    snoozeMins: 25,
    enabled: true,
    scheduleAt: null,
    audioId: null,
    imageId: null,
    audio: payload.audioUrl
      ? { id: "runtime", name: "Audio alarma", url: payload.audioUrl }
      : null,
    image: null,
  });
}, [enqueueAlarmTrigger]);

useAlarmEvents(onAlarm);

  // -------------------------------------------------------
  // 🔧 STATES DE FILTROS
  // -------------------------------------------------------
  const [status, setStatus] = useState<"all" | Status>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "priority" | "status">(
    "createdAt",
  );
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // -------------------------------------------------------
  // 🔧 TASKS
  // -------------------------------------------------------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const normalizedPriority =
        priority === "all" ? undefined : priority.toUpperCase();
      const normalizedStatus =
        status === "all" ? undefined : status.toUpperCase();

      const data = await fetchTasks({
        status: normalizedStatus,
        priority: normalizedPriority,
        search,
        sortBy,
        order,
      });

      setTasks(data);

      const allData = await fetchTasks({});
      setAllTasks(allData);
    } finally {
      setLoading(false);
    }
  }, [status, priority, search, sortBy, order]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // -------------------------------------------------------
  // 🔧 ALARMAS
  // -------------------------------------------------------
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmsError, setAlarmsError] = useState("");

  const loadAlarms = useCallback(async () => {
    try {
      const list = await getAlarms();
      setAlarms(list);
      setAlarmsError("");
    } catch (error: any) {
      console.error("Error al obtener alarmas:", error);
      setAlarms([]);
      setAlarmsError(error.message || "No se pudo cargar las alarmas");
    }
  }, []);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  // -------------------------------------------------------
  // 📊 STATS
  // -------------------------------------------------------
  const stats = useMemo(() => {
    const toK = (s: string) => s.toLowerCase();
    return {
      pending: tasks.filter((t) => toK(String(t.status)) === "pending").length,
      inProgress: tasks.filter((t) => toK(String(t.status)) === "in_progress")
        .length,
      completed: tasks.filter((t) => toK(String(t.status)) === "completed")
        .length,
      archived: tasks.filter((t) => toK(String(t.status)) === "archived").length,
      activeAlarms: tasks.filter((t) => t.alarmId != null).length,
    };
  }, [tasks]);

  const priorityStats = useMemo(() => {
    const toK = (s: string) => s.toLowerCase();
    const getPriorityTasks = (prio: string) =>
      allTasks.filter((t) => toK(String(t.priority)) === toK(prio));

    return {
      low: {
        pending: getPriorityTasks("low").filter((t) => toK(String(t.status)) === "pending").length,
        inProgress: getPriorityTasks("low").filter((t) => toK(String(t.status)) === "in_progress").length,
      },
      medium: {
        pending: getPriorityTasks("medium").filter((t) => toK(String(t.status)) === "pending").length,
        inProgress: getPriorityTasks("medium").filter((t) => toK(String(t.status)) === "in_progress").length,
      },
      high: {
        pending: getPriorityTasks("high").filter((t) => toK(String(t.status)) === "pending").length,
        inProgress: getPriorityTasks("high").filter((t) => toK(String(t.status)) === "in_progress").length,
      },
    };
  }, [allTasks]);

  // -------------------------------------------------------
  // ✏️ CRUD de TAREAS
  // -------------------------------------------------------
  async function handleCreateTask(payload: {
    title: string;
    priority: Priority;
    description?: string;
    alarmId?: string | null;
  }) {
    await createTask(payload);
    await loadTasks();
  }

  async function onChangeStatus(id: string, st: Status) {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: st } : t)),
      );

      const task = tasks.find((t) => t.id === id);

      updateTaskStatus(id, st, task).catch(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: task?.status || "pending" } : t,
          ),
        );
        alert("No se pudo cambiar el estado");
      });
    } catch {
      alert("No se pudo cambiar el estado");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await deleteTask(id);
    await loadTasks();
  }

  async function onAddSubtask(taskId: string, title: string) {
    if (!title.trim()) return;
    const temp = {
      id: `temp-${Date.now()}`,
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), temp] } : t,
      ),
    );

    try {
      const created = await addSubtask(taskId, title.trim());

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === temp.id ? created : s,
                ),
              }
            : t,
        ),
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).filter((s) => !s.id.startsWith("temp-")) }
            : t,
        ),
      );
      alert("No se pudo agregar subtarea");
    }
  }

  async function onToggleSubtask(taskId: string, subId: string, done: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks || []).map((s) =>
                s.id === subId ? { ...s, done } : s,
              ),
            }
          : t,
      ),
    );

    try {
      await toggleSubtask(taskId, subId, done);
    } catch {
      alert("Error al actualizar subtarea");
    }
  }

  async function onDeleteSubtask(taskId: string, subId: string) {
    if (!confirm("¿Eliminar subtarea?")) return;

    const backup = tasks
      .find((t) => t.id === taskId)
      ?.subtasks?.find((s) => s.id === subId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subId) }
          : t,
      ),
    );

    try {
      await deleteSubtask(taskId, subId);
    } catch {
      if (backup) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), backup] }
              : t,
          ),
        );
      }
      alert("No se pudo eliminar subtarea");
    }
  }

  async function onUpdateTaskMeta(taskId: string, payload: { title?: string; description?: string | null }) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, ...payload } : t,
      ),
    );

    try {
      await updateTask(taskId, payload);
    } catch {
      loadTasks();
      alert("No se pudo actualizar tarea");
    }
  }

  async function onLinkAlarmChange(taskId: string, alarmId: string | null) {
    const prev = tasks.find((t) => t.id === taskId);

    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, alarmId } : t)),
    );

    try {
      await linkAlarm(taskId, alarmId);
    } catch {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, alarmId: prev?.alarmId || null } : t,
        ),
      );
      alert("Error al vincular alarma");
    }
  }

  // -------------------------------------------------------
  // 🖥️ RENDER
  // -------------------------------------------------------
  return (
    <div className="dashboard">
      <Sidebar stats={stats} />

      <main className="dashboard-main">
        <Header />

        <div className="work-area">
          {/* FILTROS ------------------------------------- */}
          <section className="filters">
            <div className="filter-row">
              <div>
                <label>Estado:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="completed">Completado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div>
                <label>Prioridad:</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="all">Todas</option>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="search">
                <label>Buscar:</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por título..."
                />
              </div>

              <div>
                <label>Ordenar por:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                  <option value="createdAt">Creación</option>
                  <option value="priority">Prioridad</option>
                  <option value="status">Estado</option>
                </select>
              </div>

              <div>
                <label>Dirección:</label>
                <select value={order} onChange={(e) => setOrder(e.target.value as any)}>
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </section>

          {/* CREAR TAREA ------------------------------------- */}
          <TaskForm alarms={alarms} onSubmit={handleCreateTask} />
          {alarmsError ? <p className="muted">{alarmsError}</p> : null}

          {/* PRIORITY CARDS ------------------------------------- */}
          <section className="priority-cards">
            <button
              className={`priority-card low ${priority === "low" ? "active" : ""}`}
              onClick={() => setPriority(priority === "low" ? "all" : "low")}
            >
              <h4>Prioridad baja</h4>
              <div className="priority-stats">
                <span>Pendientes: {priorityStats.low.pending}</span>
                <span>En curso: {priorityStats.low.inProgress}</span>
              </div>
            </button>

            <button
              className={`priority-card medium ${priority === "medium" ? "active" : ""}`}
              onClick={() => setPriority(priority === "medium" ? "all" : "medium")}
            >
              <h4>Prioridad media</h4>
              <div className="priority-stats">
                <span>Pendientes: {priorityStats.medium.pending}</span>
                <span>En curso: {priorityStats.medium.inProgress}</span>
              </div>
            </button>

            <button
              className={`priority-card high ${priority === "high" ? "active" : ""}`}
              onClick={() => setPriority(priority === "high" ? "all" : "high")}
            >
              <h4>Prioridad alta</h4>
              <div className="priority-stats">
                <span>Pendientes: {priorityStats.high.pending}</span>
                <span>En curso: {priorityStats.high.inProgress}</span>
              </div>
            </button>
          </section>

          {/* LISTA ------------------------------------- */}
          <h3 className="list-title">Tareas activas</h3>
          {loading ? <p className="muted">Cargando…</p> : null}

          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                priorityLabel={priorityLabel}
                statusLabel={statusLabel}
                alarms={alarms}
                onChangeStatus={onChangeStatus}
                onDelete={onDelete}
                onLinkAlarm={onLinkAlarmChange}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onUpdateTask={onUpdateTaskMeta}
              />
            ))}

            {!loading && tasks.length === 0 && (
              <p className="muted">No hay tareas que coincidan con los filtros.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
