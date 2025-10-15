import './styles/global.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { TasksProvider } from './context/TasksContext'
import { AlarmProvider } from './context/AlarmContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import TasksPage from './pages/TasksPage'
import HistoryPage from './pages/HistoryPage'
import MediaPage from './pages/MediaPage'
import AlarmPage from './pages/AlarmPage' // <-- import estático
import { ReminderProvider } from './context/ReminderContext'
import ReminderPopup from './components/ReminderPopup'
import SettingsPage from './pages/SettingsPage'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <ReminderProvider>
      {/* Mantengo tus Providers existentes dentro para no romper la UI actual */}
      <ThemeProvider>
        <AlarmProvider>
          <TasksProvider>
            <header className="app-header">
              <Header onToggleSidebar={() => setSidebarOpen(s => !s)} />
            </header>
            <div className="layout">
              {/* Backdrop for mobile drawer */}
              <div className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

              {/* Sidebar component controls its own <aside> wrapper */}
              <Sidebar open={sidebarOpen} onNavigateClose={() => setSidebarOpen(false)} />
              <main className="content">
                <Routes>
                  <Route path="/" element={<Navigate to="/tasks" replace />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/media" element={<MediaPage />} />
                  <Route path="/alarm" element={<AlarmPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/tasks" replace />} />
                </Routes>
              </main>
            </div>
            <Toast />
          </TasksProvider>
        </AlarmProvider>
      </ThemeProvider>

      {/* Popup global montado fuera de las rutas */}
      <ReminderPopup />
    </ReminderProvider>
  )
}

export default App
