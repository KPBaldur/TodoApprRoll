// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  linkAlarm,
} from "../services/tasks";
import type { Task, Priority, Status } from "../services/tasks";
import "../styles/dashboard.css";

const priorityLabel: Record<string,string> = { low:"Baja", medium:"Media", high:"Alta", LOW:"Baja", MEDIUM:"Media", HIGH:"Alta" };
const statusLabel: Record<string,string> = {
  pending:"Pendiente", in_progress:"En curso", completed:"Completada", archived:"Archivada",
  PENDING:"Pendiente", IN_PROGRESS:"En curso", COMPLETED:"Completada", ARCHIVED:"Archivada"
};

export default function Dashboard() {
  // filtros
  const [status, setStatus] = useState<"all" | Status>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt"|"priority"|"status">("createdAt");
  const [order, setOrder] = useState<"asc"|"desc">("desc");

  // datos
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // crear tarea (form)
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [prio, setPrio] = useState<Priority>("medium");
  const [desc, setDesc] = useState("");
  const [linkAlarmOnCreate, setLinkAlarmOnCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchTasks({ status, priority, search, sortBy, order });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, priority, search, sortBy, order]);

  const stats = useMemo(() => {
    const toK = (s: string) => s.toLowerCase();
    return {
      pending: tasks.filter(t => toK(String(t.status)) === "pending").length,
      inProgress: tasks.filter(t => toK(String(t.status)) === "in_progress").length,
      completed: tasks.filter(t => toK(String(t.status)) === "completed").length,
      archived: tasks.filter(t => toK(String(t.status)) === "archived").length,
      activeAlarms: tasks.filter(t => t.alarmId != null).length,
    };
  }, [tasks]);

  async function onCreateTask() {
    if (!title.trim()) return;
    const newTask = await createTask({
      title: title.trim(),
      priority: prio,
      description: desc.trim() || undefined,
      linkAlarm: linkAlarmOnCreate,
    });
    if (linkAlarmOnCreate) await linkAlarm(newTask.id);
    setTitle(""); setPrio("medium"); setDesc(""); setLinkAlarmOnCreate(false);
    setShowCreate(false);
    await load();
  }

  async function onChangeStatus(id: number, st: Status) {
    await updateTaskStatus(id, st);
    await load();
  }

  async function onDelete(id: number) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await deleteTask(id);
    await load();
  }

  async function onAddSubtask(id: number, name: string) {
    if (!name.trim()) return;
    await addSubtask(id, name.trim());
    await load();
  }

  async function onToggleSubtask(taskId: number, subId: number, done: boolean) {
    await toggleSubtask(taskId, subId, done);
    await load();
  }

  async function onDeleteSubtask(taskId: number, subId: number) {
    await deleteSubtask(taskId, subId);
    await load();
  }

  async function onLinkAlarm(id: number) {
    await linkAlarm(id);
    await load();
  }

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />

        {/* Filtros */}
        <section className="filters">
          <div className="filter-row">
            <div>
              <label>Estado:</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value as any)}>
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En curso</option>
                <option value="completed">Completado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            <div>
              <label>Prioridad:</label>
              <select value={priority} onChange={(e)=>setPriority(e.target.value as any)}>
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
                onChange={(e)=>setSearch(e.target.value)}
                placeholder="Filtrar por título..."
              />
            </div>

            <div>
              <label>Ordenar por:</label>
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)}>
                <option value="createdAt">Creación</option>
                <option value="priority">Prioridad</option>
                <option value="status">Estado</option>
              </select>
            </div>

            <div>
              <label>Dirección:</label>
              <select value={order} onChange={(e)=>setOrder(e.target.value as any)}>
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
          </div>
        </section>

        {/* Crear tarea (acordeón) */}
        <section className="create-card">
          <button className="create-toggle" onClick={()=>setShowCreate(v=>!v)}>
            Crear tarea <span className="chev">{showCreate ? "▾" : "▸"}</span>
          </button>

          {showCreate && (
            <div className="create-body">
              <div className="grid2">
                <div>
                  <label>Título</label>
                  <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título de la tarea" />
                </div>
                <div>
                  <label>Prioridad</label>
                  <select value={prio} onChange={(e)=>setPrio(e.target.value as Priority)}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Descripción</label>
                <textarea rows={4} value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Descripción (opcional)" />
              </div>

              <label className="inline">
                <input type="checkbox" checked={linkAlarmOnCreate} onChange={(e)=>setLinkAlarmOnCreate(e.target.checked)} />
                Vincular a una alarma
              </label>

              <div className="actions">
                <button className="btn btn-primary" onClick={onCreateTask}>Guardar</button>
              </div>
            </div>
          )}
        </section>

        {/* Chips prioridad */}
        <section className="priority-chips">
          <button className={`chip low ${priority==="low" ? "active":""}`} onClick={()=>setPriority(priority==="low"?"all":"low")}>
            Prioridad baja
          </button>
          <button className={`chip medium ${priority==="medium" ? "active":""}`} onClick={()=>setPriority(priority==="medium"?"all":"medium")}>
            Prioridad media
          </button>
          <button className={`chip high ${priority==="high" ? "active":""}`} onClick={()=>setPriority(priority==="high"?"all":"high")}>
            Prioridad alta
          </button>
        </section>

        {/* Lista de tareas */}
        <h3 className="list-title">Tareas activas</h3>
        {loading ? <p className="muted">Cargando…</p> : null}
        <div className="task-list">
          {tasks.map(task => (
            <article key={task.id} className={`task-card prio-${String(task.priority).toLowerCase()}`}>
              <header className="task-head">
                <h4 className="task-title">{task.title}</h4>
                <div className="task-controls">
                  <select
                    value={String(task.status).toLowerCase()}
                    onChange={(e)=>onChangeStatus(task.id, e.target.value as Status)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En curso</option>
                    <option value="completed">Completada</option>
                    <option value="archived">Archivada</option>
                  </select>
                  <button className="btn" onClick={()=>onLinkAlarm(task.id)}>Vincular alarma</button>
                  <button className="btn danger" onClick={()=>onDelete(task.id)}>Eliminar</button>
                </div>
              </header>

              <div className="badges">
                <span className={`badge ${String(task.priority).toLowerCase()}`}>{priorityLabel[String(task.priority)] ?? task.priority}</span>
                <span className="badge outline">{statusLabel[String(task.status)] ?? task.status}</span>
              </div>

              {task.description ? <p className="task-desc">{task.description}</p> : null}

              {/* Subtareas */}
              <div className="subtasks">
                <SubtaskAdder onAdd={(name)=>onAddSubtask(task.id, name)} />
                <ul>
                  {(task.subtasks ?? []).map(st => (
                    <li key={st.id}>
                      <label className="checkline">
                        <input
                          type="checkbox"
                          checked={st.done}
                          onChange={(e)=>onToggleSubtask(task.id, st.id, e.target.checked)}
                        />
                        <span className={st.done ? "done":""}>{st.title}</span>
                      </label>
                      <button className="btn xs danger" onClick={()=>onDeleteSubtask(task.id, st.id)}>Eliminar</button>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}

          {!loading && tasks.length === 0 && (
            <p className="muted">No hay tareas que coincidan con los filtros.</p>
          )}
        </div>
      </main>
    </div>
  );
}

/** Pequeño componente interno para añadir subtareas */
function SubtaskAdder({ onAdd }: { onAdd: (name: string)=>void }) {
  const [val, setVal] = useState("");
  return (
    <div className="subtask-adder">
      <label className="inline">
        <input type="checkbox" disabled /> Subtarea
      </label>
      <input
        value={val}
        onChange={(e)=>setVal(e.target.value)}
        placeholder="Nombre de subtarea"
      />
      <button className="btn xs" onClick={()=>{ onAdd(val); setVal(""); }}>Añadir subtarea</button>
    </div>
  );
}
