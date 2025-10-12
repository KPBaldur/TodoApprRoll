import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'

export default function Sidebar() {
  const { counts, applyFilters } = useTasks()
  const location = useLocation()
  const navigate = useNavigate()

  function onStatusClick(status: 'pending' | 'working' | 'completed' | 'archived') {
    const current = new URLSearchParams(location.search).get('status')
    const next = current === status ? null : status
    applyFilters({ status: next || undefined })
    navigate('/tasks' + (next ? `?status=${next}` : ''), { replace: false })
  }

  return (
    <aside className="app-sidebar">
      <nav>
        <Link to="/tasks" className={location.pathname === '/tasks' ? 'active' : ''}>Tareas</Link>
        <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>Historial</Link>
        <Link to="/media" className={location.pathname === '/media' ? 'active' : ''}>Multimedia</Link>
        <Link to="/alarm" className={location.pathname === '/alarm' ? 'active' : ''}>Alarmas</Link>
        <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Configuración</Link>
      </nav>

      <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Estados</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('pending') }}>Pendientes</a>
          <span className="badge">{counts.pending}</span>

          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('working') }}>En curso</a>
          <span className="badge">{counts.working}</span>

          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('completed') }}>Completadas</a>
          <span className="badge">{counts.completed}</span>

          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('archived') }}>Archivadas</a>
          <span className="badge">{counts.archived}</span>
        </div>
      </div>
    </aside>
  )
}