// src/services/tasks.ts
import { getToken, refreshAccessToken } from "./auth";

// Usar URL absoluta para cloud (Render)
export const API_URL = "https://todoapprroll.onrender.com/api";
// En desarrollo local, usar: const API_URL = "/api";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

/**
 * Wrapper para fetch que maneja automáticamente la renovación de tokens
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  });

  // Si el token expiró (401), intentamos renovarlo
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Reintentamos la petición con el nuevo token
      response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders(),
          ...options.headers,
        },
      });
    } else {
      // Si no pudimos renovar, redirigir al login
      window.location.href = "/";
      throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    }
  }

  return response;
}

/** Tipos básicos (ajustados al schema del backend) */
export type Priority = "low" | "medium" | "high" | "LOW" | "MEDIUM" | "HIGH";
export type Status = "pending" | "in_progress" | "completed" | "archived" |
                     "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: Status;
  createdAt?: string;
  subtasks?: Subtask[];
  alarmId?: string | null;
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

  const res = await fetchWithAuth(`${API_URL}/tasks?${query.toString()}`);
  if (!res.ok) throw new Error("No se pudieron cargar las tareas");
  return (await res.json()) as Task[];
}

/** Crear tarea */
export async function createTask(payload: {
  title: string;
  priority: Priority;
  description?: string;
  alarmId?: string | null;
}) {
  const res = await fetchWithAuth(`${API_URL}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo crear la tarea");
  return (await res.json()) as Task;
}

/** Editar tarea */
export async function updateTask(id: string, payload: Partial<Task>) {
  const res = await fetchWithAuth(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo actualizar la tarea");
  return (await res.json()) as Task;
}

/** Cambiar estado - Usa PUT ya que el backend no tiene endpoint PATCH /status */
export async function updateTaskStatus(id: string, status: Status, currentTask?: Task) {
  // Si ya tenemos la tarea actual, la usamos. Si no, la obtenemos.
  let task = currentTask;
  if (!task) {
    const tasks = await fetchTasks({});
    task = tasks.find(t => t.id === id);
    if (!task) throw new Error("Tarea no encontrada");
  }
  
  // Actualizamos solo el status usando PUT
  return updateTask(id, { ...task, status });
}

/** Eliminar */
export async function deleteTask(id: string) {
  const res = await fetchWithAuth(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar la tarea");
  return true;
}

/** Agregar subtarea */
export async function addSubtask(taskId: string, title: string) {
  const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "No se pudo crear la subtarea" }));
    throw new Error(error.message || "No se pudo crear la subtarea");
  }
  return (await res.json()) as Subtask;
}

/** Toggle subtarea (marcar como completada/pendiente) */
export async function toggleSubtask(taskId: string, subtaskId: string, done: boolean) {
  const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "PUT",
    body: JSON.stringify({ done }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "No se pudo actualizar la subtarea" }));
    throw new Error(error.message || "No se pudo actualizar la subtarea");
  }
  return (await res.json()) as Subtask;
}

/** Eliminar subtarea */
export async function deleteSubtask(taskId: string, subtaskId: string) {
  const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "No se pudo eliminar la subtarea" }));
    throw new Error(error.message || "No se pudo eliminar la subtarea");
  }
  return true;
}

/** Vincular alarma - TEMPORALMENTE DESHABILITADO hasta verificar endpoint */
export async function linkAlarm(taskId: string, alarmId: string | null) {
  const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/link-alarm`, {
    method: "POST",
    body: JSON.stringify({ alarmId }),
  });
  if (!res.ok) {
    throw new Error("No se pudo vincular la alarma");
  }
  return (await res.json()) as Task;
}
