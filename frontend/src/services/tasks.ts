// src/services/tasks.ts
import { getToken, refreshAccessToken } from "./auth";

// Usar URL absoluta para cloud (Render)
const API_URL = "https://todoapprroll.onrender.com/api";
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
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
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
  linkAlarm?: boolean; // si quieres vincular alarma a la creación
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

/** Subtareas - TEMPORALMENTE DESHABILITADO hasta que el backend lo implemente */
export async function addSubtask(_taskId: string, _title: string) {
  console.warn("Funcionalidad de subtareas no disponible todavía.");
  throw new Error("Funcionalidad de subtareas no disponible todavía");
}

export async function toggleSubtask(_taskId: string, _subtaskId: string, _done: boolean) {
  console.warn("Funcionalidad de subtareas no disponible todavía.");
  throw new Error("Funcionalidad de subtareas no disponible todavía");
}

export async function deleteSubtask(_taskId: string, _subtaskId: string) {
  console.warn("Funcionalidad de subtareas no disponible todavía.");
  throw new Error("Funcionalidad de subtareas no disponible todavía");
}

/** Vincular alarma - TEMPORALMENTE DESHABILITADO hasta verificar endpoint */
export async function linkAlarm(_taskId: string) {
  console.warn("Funcionalidad de vincular alarma no disponible todavía.");
  throw new Error("Funcionalidad de vincular alarma no disponible todavía");
}
