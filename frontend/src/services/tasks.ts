// src/services/tasks.ts
const API = "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

/** Tipos básicos (ajustados al schema del backend) */
export type Priority = "low" | "medium" | "high" | "LOW" | "MEDIUM" | "HIGH";
export type Status = "pending" | "in_progress" | "completed" | "archived" |
                     "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";

export interface Subtask {
  id: number;
  title: string;
  done: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  status: Status;
  createdAt?: string;
  subtasks?: Subtask[];
  alarmId?: number | null;
}

/** Listar tareas con filtros */
export async function fetchTasks(params: {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: "createdAt" | "priority" | "status";
  order?: "asc" | "desc";
}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.priority && params.priority !== "all") query.set("priority", params.priority);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);

  const res = await fetch(`${API}/tasks?${query.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No se pudieron cargar las tareas");
  return (await res.json()) as Task[];
}

/** Crear tarea */
export async function createTask(payload: {
  title: string;
  priority: Priority;
  description?: string;
  linkAlarm?: boolean; // si quieres vincular alarma a la creación
}) {
  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo crear la tarea");
  return (await res.json()) as Task;
}

/** Editar tarea */
export async function updateTask(id: number, payload: Partial<Task>) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo actualizar la tarea");
  return (await res.json()) as Task;
}

/** Cambiar estado */
export async function updateTaskStatus(id: number, status: Status) {
  const res = await fetch(`${API}/tasks/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("No se pudo cambiar el estado");
  return (await res.json()) as Task;
}

/** Eliminar */
export async function deleteTask(id: number) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudo eliminar la tarea");
  return true;
}

/** Subtareas */
export async function addSubtask(taskId: number, title: string) {
  const res = await fetch(`${API}/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("No se pudo añadir la subtarea");
  return (await res.json()) as Subtask;
}

export async function toggleSubtask(taskId: number, subtaskId: number, done: boolean) {
  const res = await fetch(`${API}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error("No se pudo actualizar la subtarea");
  return (await res.json()) as Subtask;
}

export async function deleteSubtask(taskId: number, subtaskId: number) {
  const res = await fetch(`${API}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudo eliminar la subtarea");
  return true;
}

/** Vincular alarma (el backend asigna nombre de la tarea a la alarma) */
export async function linkAlarm(taskId: number) {
  const res = await fetch(`${API}/alarms/link-task/${taskId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("No se pudo vincular la alarma");
  return await res.json();
}
