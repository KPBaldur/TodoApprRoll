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
import useAlarmEvents from "../hooks/useAlarmEvents";

useAlarmEvents((payload) => {
  console.log("🔔 ALARMA RECIBIDA EN FRONT:", payload);

  // Mostrar popup
  alert(`🔔 Alarma: ${payload.name}`);

  // Reproducir sonido automáticamente
  if (payload.audioUrl) {
    const audio = new Audio(payload.audioUrl);
    audio.play().catch(() => {
      console.warn("Audio bloqueado por navegador, se requiere interacción.");
    });
  }
});


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
  const [status, setStatus] = useState<"all" | Status>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "priority" | "status">(
    "createdAt",
  );
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Todas las tareas para estadísticas
  const [loading, setLoading] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmsError, setAlarmsError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Normalizar priority a mayúsculas para el backend
      const normalizedPriority = priority === "all" ? undefined : priority.toUpperCase();
      const normalizedStatus = status === "all" ? undefined : status.toUpperCase();
      const data = await fetchTasks({ 
        status: normalizedStatus, 
        priority: normalizedPriority, 
        search, 
        sortBy, 
        order 
      });
      setTasks(data);
      
      // Cargar todas las tareas sin filtros para estadísticas
      const allData = await fetchTasks({});
      setAllTasks(allData);
    } finally {
      setLoading(false);
    }
  }, [status, priority, search, sortBy, order]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const loadAlarms = useCallback(async () => {
    try {
      const list = await getAlarms();
      setAlarms(list);
      setAlarmsError("");
    } catch (error: any) {
      console.error("Error al obtener alarmas:", error);
      setAlarms([]);
      setAlarmsError(
        error.message || "No se pudo cargar el listado de alarmas",
      );
    }
  }, []);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

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

  // Estadísticas por prioridad (usando todas las tareas sin filtros)
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
      // Optimización: actualizar el estado local inmediatamente
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: st } : t))
      );
      
      // Actualizar en el backend (sin esperar la respuesta completa)
      const task = tasks.find((t) => t.id === id);
      updateTaskStatus(id, st, task).catch((error) => {
        console.error("Error al cambiar estado:", error);
        // Revertir el cambio si falla
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === id ? { ...t, status: task?.status || "pending" } : t))
        );
        alert("No se pudo cambiar el estado de la tarea");
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("No se pudo cambiar el estado de la tarea");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      await deleteTask(id);
      await loadTasks();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar la tarea");
    }
  }

  async function onAddSubtask(taskId: string, title: string) {
    if (!title.trim()) return;
    try {
      // Optimización: actualizar el estado local inmediatamente
      const newSubtask = {
        id: `temp-${Date.now()}`,
        title: title.trim(),
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
            : t
        )
      );
      
      // Crear en el backend
      const created = await addSubtask(taskId, title.trim());
      
      // Reemplazar la subtarea temporal con la real
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === newSubtask.id ? created : s
                ),
              }
            : t
        )
      );
    } catch (error: any) {
      console.error("Error al añadir subtarea:", error);
      // Revertir el cambio si falla
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).filter(
                  (s) => !s.id.startsWith("temp-")
                ),
              }
            : t
        )
      );
      alert(error.message || "No se pudo añadir la subtarea.");
    }
  }

  async function onToggleSubtask(taskId: string, subId: string, done: boolean) {
    try {
      // Optimización: actualizar el estado local inmediatamente
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === subId ? { ...s, done } : s
                ),
              }
            : t
        )
      );
      
      // Actualizar en el backend
      await toggleSubtask(taskId, subId, done).catch((error: any) => {
        console.error("Error al actualizar subtarea:", error);
        // Revertir el cambio si falla
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === subId ? { ...s, done: !done } : s
                  ),
                }
              : t
          )
        );
        alert(error.message || "No se pudo actualizar la subtarea.");
      });
    } catch (error: any) {
      console.error("Error al actualizar subtarea:", error);
      alert(error.message || "No se pudo actualizar la subtarea.");
    }
  }

  async function onDeleteSubtask(taskId: string, subId: string) {
    if (!confirm("¿Eliminar esta subtarea?")) return;
    try {
      // Optimización: actualizar el estado local inmediatamente
      const subtaskToDelete = tasks
        .find((t) => t.id === taskId)
        ?.subtasks?.find((s) => s.id === subId);
      
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).filter((s) => s.id !== subId),
              }
            : t
        )
      );
      
      // Eliminar en el backend
      await deleteSubtask(taskId, subId).catch((error: any) => {
        console.error("Error al eliminar subtarea:", error);
        // Revertir el cambio si falla
        if (subtaskToDelete) {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    subtasks: [...(t.subtasks || []), subtaskToDelete],
                  }
                : t
            )
          );
        }
        alert(error.message || "No se pudo eliminar la subtarea.");
      });
    } catch (error: any) {
      console.error("Error al eliminar subtarea:", error);
      alert(error.message || "No se pudo eliminar la subtarea.");
    }
  }

  async function onUpdateTaskMeta(
    taskId: string,
    payload: { title?: string; description?: string | null },
  ) {
    try {
      // Optimización: actualizar el estado local inmediatamente
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, title: payload.title ?? t.title, description: payload.description ?? t.description }
            : t
        )
      );
      
      // Actualizar en el backend
      updateTask(taskId, payload).catch((error: any) => {
        console.error("Error al actualizar tarea:", error);
        // Revertir el cambio si falla
        loadTasks();
        alert(error.message || "No se pudo actualizar la tarea");
      });
    } catch (error: any) {
      console.error("Error al actualizar la tarea:", error);
      alert(error.message || "No se pudo actualizar la tarea.");
    }
  }

  async function onLinkAlarmChange(taskId: string, alarmId: string | null) {
    try {
      // Optimización: actualizar el estado local inmediatamente
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, alarmId } : t))
      );
      
      // Actualizar en el backend
      linkAlarm(taskId, alarmId).catch((error: any) => {
        console.error("Error al vincular alarma:", error);
        // Revertir el cambio si falla
        const task = tasks.find((t) => t.id === taskId);
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? { ...t, alarmId: task?.alarmId || null } : t))
        );
        alert(error.message || "No se pudo vincular la alarma");
      });
    } catch (error: any) {
      console.error("Error al vincular alarma:", error);
      alert(error.message || "No se pudo vincular la alarma");
    }
  }

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />

        <div className="work-area">
          <section className="filters">
            <div className="filter-row">
              <div>
                <label>Estado:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="completed">Completado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div>
                <label>Prioridad:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
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
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="createdAt">Creación</option>
                  <option value="priority">Prioridad</option>
                  <option value="status">Estado</option>
                </select>
              </div>

              <div>
                <label>Dirección:</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as any)}
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </section>

          <TaskForm alarms={alarms} onSubmit={handleCreateTask} />
          {alarmsError ? <p className="muted">{alarmsError}</p> : null}

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
