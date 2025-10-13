import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Task } from '../services/taskService'
import { listTasks, createTask as createTaskApi, editTask as editTaskApi, completeTask as completeTaskApi, deleteTask as deleteTaskApi, archiveTask as archiveTaskApi,
unarchiveTask as unarchiveTaskApi } from '../services/taskService'

type Filters = { status?: Task['status']; priority?: Task['priority']; q?: string }

type Counts = { pending: number; working: number; completed: number; archived: number }

type TasksContextType = {
  tasks: Task[]
  loading: boolean
  error?: string
  filters: Filters
  counts: Counts
  reload: () => void
  applyFilters: (f: Partial<Filters>) => void
  createTask: (payload: Partial<Task>) => Promise<void>
  editTask: (id: string, payload: Partial<Task>) => Promise<void>
  completeTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  archiveTask: (id: string) => Promise<void>
  unarchiveTask: (id: string) => Promise<void>
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [filters, setFilters] = useState<Filters>({})

  async function reload() {
    setLoading(true)
    setError(undefined)
    try {
      const res = await listTasks({ status: filters.status, q: filters.q })
      setTasks(res.data.tasks || [])
    } catch (e: any) {
      setError(e?.message || 'Error cargando tareas')
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [filters.status, filters.q])

  function applyFilters(f: Partial<Filters>) {
    setFilters(prev => ({ ...prev, ...f }))
  }

  async function createTask(payload: Partial<Task>) {
    await createTaskApi(payload)
    await reload()
  }
  async function editTask(id: string, payload: Partial<Task>) {
    await editTaskApi(id, payload)
    await reload()
  }
  async function completeTask(id: string) {
    await completeTaskApi(id)
    await reload()
  }
  async function deleteTask(id: string) {
    await deleteTaskApi(id)
    await reload()
  }
  async function archiveTask(id: string) {
    await archiveTaskApi(id)
    await reload()
  }
  async function unarchiveTask(id: string) {
    await unarchiveTaskApi(id)
    await reload()
  }

  const counts: Counts = useMemo(() => {
    const c: Counts = { pending: 0, working: 0, completed: 0, archived: 0 }
    for (const t of tasks) {
      if (t.status in c) c[t.status as keyof Counts]++
    }
    return c
  }, [tasks])

  const value: TasksContextType = {
    tasks, loading, error,
    filters, counts,
    reload, applyFilters,
    createTask, editTask, completeTask, deleteTask,
    archiveTask, unarchiveTask
  }

  return (<TasksContext.Provider value={value}>{children}</TasksContext.Provider>)
}
export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasksContext must be used within TasksProvider')
  return ctx
}