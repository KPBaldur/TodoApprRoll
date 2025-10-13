import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import type { Task } from '../services/taskService'
import SubtaskModal from '../components/SubtaskModal'

type SortBy = 'title' | 'priority' | 'status' | 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

export default function TasksPage() {
  const { tasks, loading, error, createTask, editTask, completeTask, deleteTask, applyFilters, filters, reload } = useTasks()
  const location = useLocation()
  const navigate = useNavigate()

  const statuses: Array<Task['status'] | 'all'> = ['all', 'pending', 'working', 'completed', 'archived']
  const priorities: Array<Task['priority'] | 'all'> = ['all', 'low', 'medium', 'high']

  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editModel, setEditModel] = useState<{ title: string; description: string; priority: Task['priority']; subtasks: { title: string; completed: boolean }[] }>({ title: '', description: '', priority: 'medium', subtasks: [] })
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [subtaskModal, setSubtaskModal] = useState<{ open: boolean; task: Task | null; title: string }>({ open: false, task: null, title: '' })

  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', description: '', priority: 'medium', remember: false })
  const [createOpen, setCreateOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('createFormOpen') === '1' } catch { return false }
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status') as Task['status'] | null
    const valid = ['pending', 'working', 'completed', 'archived']
    setStatusFilter(status && valid.includes(status) ? status : 'all')
    reload()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const filtered = useMemo(() => {
    let list = [...tasks]
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter)
    const q = searchText.trim().toLowerCase()
    if (q) list = list.filter(t => (t.title || '').toLowerCase().includes(q))

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av = (a as any)[sortBy]
      const bv = (b as any)[sortBy]
      if (av === bv) return 0
      return av > bv ? dir : -dir
    })
    return list
  }, [tasks, statusFilter, priorityFilter, searchText, sortBy, sortDir])

  const prioCounts = useMemo(() => {
    return {
      low:    { pending: tasks.filter(t => t.priority === 'low'    && t.status === 'pending').length, working: tasks.filter(t => t.priority === 'low'    && t.status === 'working').length },
      medium: { pending: tasks.filter(t => t.priority === 'medium' && t.status === 'pending').length, working: tasks.filter(t => t.priority === 'medium' && t.status === 'working').length },
      high:   { pending: tasks.filter(t => t.priority === 'high'   && t.status === 'pending').length, working: tasks.filter(t => t.priority === 'high'   && t.status === 'working').length },
    }
  }, [tasks])

  function onFilterChange(next: Task['status'] | 'all') {
    setStatusFilter(next)
    const statusParam = next !== 'all' ? next : null
    navigate('/tasks' + (statusParam ? `?status=${statusParam}` : ''), { replace: false })
    applyFilters({ status: statusParam || undefined })
  }
  function onPriorityChange(next: Task['priority' ] | 'all') {
    setPriorityFilter(next)
  }
  function onPriorityToggle(p: Task['priority']) {
    setPriorityFilter(prev => prev === p ? 'all' : p)
  }
  function onSearch(text: string) {
    setSearchText(text)
    applyFilters({ q: text })
  }
  function onSortChange(next: SortBy) { setSortBy(next) }
  function onDirChange(next: SortDir) { setSortDir(next) }

  function canSave() {
    const title = (newTask.title || '').trim()
    return title.length >= 3
  }
  async function handleCreate() {
    const payload = {
      title: (newTask.title || '').trim(),
      description: (newTask.description || '').trim(),
      priority: newTask.priority || 'medium',
      remember: !!newTask.remember
    }
    if (!payload.title || payload.title.length < 3) return
    await createTask(payload)
    setNewTask({ title: '', description: '', priority: 'medium', remember: false })
  }

  function startEdit(t: Task) {
    setEditingId(t.id)
    setEditModel({ title: t.title, description: t.description || '', priority: t.priority, subtasks: (t.subtasks || []).map(s => ({ title: s.title, completed: !!s.completed })) })
    setNewSubtaskTitle('')
  }
  function cancelEdit() {
    setEditingId(null)
    setEditModel({ title: '', description: '', priority: 'medium', subtasks: [] })
    setNewSubtaskTitle('')
  }
  async function saveEdit(original: Task) {
    if (!editingId) return
    const payload: Partial<Task> = {
      title: (editModel.title || '').trim(),
      description: (editModel.description || '').trim(),
      priority: editModel.priority,
      subtasks: editModel.subtasks
    }
    if (!payload.title || payload.title.length < 3) return
    await editTask(editingId, payload)
    setEditingId(null)
    setEditModel({ title: '', description: '', priority: 'medium', subtasks: [] })
  }

  async function toggleSubtask(t: Task, index: number, completed: boolean) {
    const subtasks = (t.subtasks || []).map((s, i) => i === index ? { ...s, completed } : s)
    await editTask(t.id, { subtasks })
  }
  async function addSubtaskInline(t: Task, title: string) {
    const name = (title || '').trim(); if (!name) return
    const subtasks = [...(t.subtasks || []), { title: name, completed: false }]
    await editTask(t.id, { subtasks })
  }

  function autoResize(e: FormEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }

  async function deleteSubtaskInline(t: Task, index: number) {
    const next = (t.subtasks || []).filter((_, i) => i !== index)
    await editTask(t.id, { subtasks: next })
  }

  function openSubtaskModal(t: Task) { setSubtaskModal({ open: true, task: t, title: '' }) }
  function closeSubtaskModal() { setSubtaskModal({ open: false, task: null, title: '' }) }
  async function submitSubtaskModal() {
    const title = subtaskModal.title.trim()
    if (subtaskModal.task && title) {
      await addSubtaskInline(subtaskModal.task, title)
      closeSubtaskModal()
    }
  }

  return (
    <section className="page">
      <h2 className="page-title">Tareas</h2>

      <div className="filters-bar">
        <label>
          Estado:
          <select value={statusFilter} onChange={(e) => onFilterChange(e.target.value as any)}>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>

        <label>
          Prioridad:
          <select value={priorityFilter} onChange={(e) => onPriorityChange(e.target.value as any)}>
            {priorities.map(p => (<option key={p} value={p}>{p}</option>))}
          </select>
        </label>

        <label className="filters-search">
          Buscar:
          <input value={searchText} onChange={(e) => onSearch(e.target.value)} type="text" placeholder="Filtrar por título..." />
        </label>

        <label>
          Ordenar por:
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortBy)}>
            <option value="title">Título</option>
            <option value="priority">Prioridad</option>
            <option value="status">Estado</option>
            <option value="createdAt">Creación</option>
            <option value="updatedAt">Actualización</option>
          </select>
        </label>
        <label>
          Dirección:
          <select value={sortDir} onChange={(e) => onDirChange(e.target.value as SortDir)}>
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>
      </div>

  <details className="panel collapsible" open={createOpen} onToggle={(e) => { const open = (e.target as HTMLDetailsElement).open; setCreateOpen(open); try { localStorage.setItem('createFormOpen', open ? '1' : '0') } catch {} }}>
    <summary>Crear tarea</summary>
    <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <label>
        Título
        <input value={newTask.title || ''} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} type="text" placeholder="Título de la tarea" />
      </label>
      <label>
        Prioridad
        <select value={newTask.priority || 'medium'} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </label>
      <label style={{ gridColumn: '1 / -1' }}>
        Descripción
        <textarea className="textarea-auto" value={newTask.description || ''} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} onInput={autoResize} rows={3} placeholder="Descripción (opcional)"></textarea>
      </label>
      <label>
        <input type="checkbox" checked={!!newTask.remember} onChange={(e) => setNewTask({ ...newTask, remember: e.target.checked })} /> Recordatorio
      </label>
      <div style={{ textAlign: 'right' }}>
        <button className="btn" onClick={handleCreate} disabled={!canSave()}>Guardar</button>
      </div>
    </div>
  </details>

      <div className="priority-filters">
        <button type="button" className={`prio-btn low ${priorityFilter === 'low' ? 'active' : ''}`} onClick={() => onPriorityToggle('low')}>
          <div className="prio-header">Prioridad baja</div>
          <div className="prio-counters">
            <span>Pendientes: {prioCounts.low.pending}</span>
            <span>En curso: {prioCounts.low.working}</span>
          </div>
        </button>
        <button type="button" className={`prio-btn medium ${priorityFilter === 'medium' ? 'active' : ''}`} onClick={() => onPriorityToggle('medium')}>
          <div className="prio-header">Prioridad media</div>
          <div className="prio-counters">
            <span>Pendientes: {prioCounts.medium.pending}</span>
            <span>En curso: {prioCounts.medium.working}</span>
          </div>
        </button>
        <button type="button" className={`prio-btn high ${priorityFilter === 'high' ? 'active' : ''}`} onClick={() => onPriorityToggle('high')}>
          <div className="prio-header">Prioridad alta</div>
          <div className="prio-counters">
            <span>Pendientes: {prioCounts.high.pending}</span>
            <span>En curso: {prioCounts.high.working}</span>
          </div>
        </button>
      </div>

      <h3 className="section-title">Tareas activas</h3>

      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <ul className="task-list">
        {filtered.map(t => (
          <li key={t.id} className={`task-item priority-${t.priority}`}>
            <div className="title">{t.title}</div>
            <div className="meta">
              <span className={`badge priority ${t.priority}`}>{t.priority}</span>
              <span className={`badge status ${t.status}`}>{t.status}</span>
            </div>
            <div className="actions">
              {editingId === t.id ? (
                <>
                  <button className="btn" onClick={() => saveEdit(t)}>Guardar cambios</button>
                  <button className="btn" onClick={cancelEdit}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => completeTask(t.id)}>Cambiar estado</button>
                  <button className="btn" onClick={() => startEdit(t)}>Editar</button>
                  <button className="btn danger" onClick={() => { if (confirm('¿Seguro que deseas eliminar esta tarea?')) deleteTask(t.id) }}>Eliminar</button>
                </>
              )}
            </div>
            <div className="details">
              {editingId === t.id ? (
                <>
                  <div className="description">
                    <textarea className="textarea-auto" value={editModel.description} onChange={(e) => setEditModel({ ...editModel, description: e.target.value })} onInput={autoResize} />
                  </div>
                  <div className="subtasks">
                    {(editModel.subtasks || []).map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                          <input type="checkbox" checked={!!s.completed} onChange={(e) => setEditModel({ ...editModel, subtasks: editModel.subtasks.map((x, idx) => idx === i ? { ...x, completed: e.target.checked } : x) })} />
                          <input type="text" value={s.title} onChange={(e) => setEditModel({ ...editModel, subtasks: editModel.subtasks.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x) })} />
                        </label>
                        <button className="btn" onClick={() => setEditModel({ ...editModel, subtasks: editModel.subtasks.filter((_, idx) => idx !== i) })}>Eliminar</button>
                      </div>
                    ))}
                    <div className="subtasks-add">
                      <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Nueva subtarea…" />
                      <button className="btn" onClick={() => { if (newSubtaskTitle.trim()) setEditModel({ ...editModel, subtasks: [...editModel.subtasks, { title: newSubtaskTitle.trim(), completed: false }] }); setNewSubtaskTitle('') }}>Añadir</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {t.description && <div className="description">{t.description}</div>}
                  <ul className="subtasks">
                    {(t.subtasks || []).map((s, i) => (
                      <li key={i}>
                        <label className={s.completed ? 'completed' : ''}>
                          <input type="checkbox" checked={!!s.completed} onChange={(e) => toggleSubtask(t, i, e.target.checked)} /> {s.title}
                        </label>
                        <button className="btn" onClick={() => deleteSubtaskInline(t, i)}>Eliminar subtarea</button>
                      </li>
                    ))}
                  </ul>
                  <div className="subtasks-add">
                    <button className="btn" onClick={() => openSubtaskModal(t)}>Añadir subtarea</button>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p style={{ opacity: 0.8 }}>No hay tareas. Crea una nueva arriba y pulsa "Guardar".</p>
      )}
      <SubtaskModal
        open={subtaskModal.open}
        value={subtaskModal.title}
        onChange={(v) => setSubtaskModal({ ...subtaskModal, title: v })}
        onSubmit={submitSubtaskModal}
        onClose={closeSubtaskModal}
      />
    </section>
  )
}