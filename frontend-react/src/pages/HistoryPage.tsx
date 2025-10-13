import { useEffect, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'

export default function HistoryPage() {
  const { tasks, loading, error, applyFilters, reload, unarchiveTask, deleteTask } = useTasks()

  useEffect(() => {
    applyFilters({ status: 'archived' })
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const archived = useMemo(() => tasks.filter(t => t.status === 'archived'), [tasks])

  return (
    <section className="page">
      <h2 className="page-title">Historial</h2>
      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}
      <ul className="task-list">
        {archived.map(t => (
          <li key={t.id} className={`task-item priority-${t.priority}`}>
            <div className="title">{t.title}</div>
            <div className="meta">
              <span className={`badge priority ${t.priority}`}>{t.priority}</span>
              <span className={`badge status ${t.status}`}>{t.status}</span>
              {t.completedAt && <span className="badge">Completada: {new Date(t.completedAt).toLocaleString()}</span>}
            </div>
            <div className="actions">
              <button className="btn" onClick={() => unarchiveTask(t.id)}>Restaurar</button>
              <button className="btn danger" onClick={() => { if (confirm('¿Eliminar definitivamente?')) deleteTask(t.id) }}>Eliminar</button>
            </div>
            <div className="details">
              {t.description && <div className="description">{t.description}</div>}
              {/* Resolución si existe */}
              {(t.resolution || (t.resolutionImages && t.resolutionImages.length > 0)) && (
                <div className="panel" style={{ marginTop: 10 }}>
                  <div className="panel-body">
                    {t.resolution && <div style={{ marginBottom: 8 }}><strong>Resolución:</strong> {t.resolution}</div>}
                    {(t.resolutionImages && t.resolutionImages.length > 0) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {t.resolutionImages.map((url, i) => (
                          <img key={i} src={url} alt={`res-${i}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {archived.length === 0 && <p style={{ opacity: 0.8 }}>No hay tareas archivadas.</p>}
    </section>
  )
}