import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'

type Props = {
  open?: boolean
  onNavigateClose?: () => void
}

export default function Sidebar({ open = false, onNavigateClose }: Props) {
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
    <aside className={`app-sidebar ${open ? 'open' : ''}`}>
      <nav>
        <Link to="/tasks" onClick={onNavigateClose} className={location.pathname === '/tasks' ? 'active' : ''}>Tareas</Link>
        <Link to="/history" onClick={onNavigateClose} className={location.pathname === '/history' ? 'active' : ''}>Historial</Link>
        <Link to="/media" onClick={onNavigateClose} className={location.pathname === '/media' ? 'active' : ''}>Multimedia</Link>
        <Link to="/alarm" onClick={onNavigateClose} className={location.pathname === '/alarm' ? 'active' : ''}>Alarmas</Link>
        <Link to="/settings" onClick={onNavigateClose} className={location.pathname === '/settings' ? 'active' : ''}>Configuración</Link>
      </nav>

      <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Estados</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('pending'); onNavigateClose?.() }}>Pendientes</a>
          <span className="badge">{counts.pending}</span>

          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('working'); onNavigateClose?.() }}>En curso</a>
          <span className="badge">{counts.working}</span>

          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('completed'); onNavigateClose?.() }}>Completadas</a>
          <span className="badge">{counts.completed}</span>

          <a href="#" onClick={(e) => { e.preventDefault(); onStatusClick('archived'); onNavigateClose?.() }}>Archivadas</a>
          <span className="badge">{counts.archived}</span>
        </div>
      </div>
    </aside>
  )
}