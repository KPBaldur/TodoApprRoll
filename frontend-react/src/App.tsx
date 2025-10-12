import './styles/global.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TasksPage from './pages/TasksPage'
import { TasksProvider } from './context/TasksContext'
import Toast from './components/Toast'

function App() {
  return (
    <TasksProvider>
      <header className="app-header">
        <Header />
      </header>
      <div className="layout">
        <aside className="app-sidebar">
          <Sidebar />
        </aside>
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/history" element={<div className="page"><h2>Historial</h2><p>En construcción…</p></div>} />
            <Route path="/media" element={<div className="page"><h2>Multimedia</h2><p>En construcción…</p></div>} />
            <Route path="/alarm" element={<div className="page"><h2>Alarmas</h2><p>En construcción…</p></div>} />
            <Route path="/settings" element={<div className="page"><h2>Configuración</h2><p>En construcción…</p></div>} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </TasksProvider>
  )
}

export default App
