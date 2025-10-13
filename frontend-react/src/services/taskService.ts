import { get, post, put, patch, del } from './api'

export type Subtask = { title: string; completed?: boolean }
export type Task = {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'working' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
  completedAt?: string
  subtasks: Subtask[]
  remember: boolean
  // Nuevos campos
  resolution?: string
  resolutionImages?: string[]
}

export async function listTasks(params?: { status?: Task['status']; q?: string }) {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.q) query.set('q', params.q)
  return get<{ success: boolean; data: { tasks: Task[] } }>(`/api/tasks${query.toString() ? `?${query.toString()}` : ''}`)
}

export async function createTask(payload: Partial<Task>) {
  return post<{ success: boolean; data: { task: Task } }>(`/api/tasks`, payload)
}

export async function editTask(id: string, payload: Partial<Task>) {
  return put<{ success: boolean; data: { task: Task } }>(`/api/tasks/${id}`, payload)
}

export async function completeTask(id: string) {
  return patch<{ success: boolean; data: { task: Task } }>(`/api/tasks/${id}/toggle`)
}

export async function archiveTask(id: string) {
  return patch<{ success: boolean; data: { task: Task } }>(`/api/tasks/${id}/archive`)
}
export async function unarchiveTask(id: string) {
  return patch<{ success: boolean; data: { task: Task } }>(`/api/tasks/${id}/unarchive`)
}

export async function deleteTask(id: string) {
  return del<{ success: boolean }>(`/api/tasks/${id}`)
}